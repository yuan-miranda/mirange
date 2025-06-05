from machine import UART, Pin
import network  # type: ignore
import os
import time
import uasyncio as asyncio  # type: ignore

ssid = "PICO_AP"
password = "123456789"
port = 80

# board debugger
led = Pin("LED", Pin.OUT)

uart = UART(0, baudrate=115200, tx=Pin(0), rx=Pin(1))
control_states = "000000"  # W, S, E, F, A, D

# [days:hours:minutes:seconds] [function_name()] [category] message
# category: INFO, WARNING, ERROR, DEBUG
#           (1) INFO - general information
#           (2) WARNING - warning information
#           (3) ERROR - error information
#           (4) DEBUG - debug information
# example: [00:00:00:00] [main()] [INFO] Hello, World!
category_map = {
    1: ["INFO", "#0000FF"],
    2: ["WARNING", "#FFA500"],
    3: ["ERROR", "#FF0000"],
    4: ["DEBUG", "#00FF00"],
}
start_time = time.time()
log = lambda func__name, category, msg: print(
    f"[{int(time.time() - start_time) // 86400:02}:{(int(time.time() - start_time) % 86400) // 3600:02}:{(int(time.time() - start_time) % 3600) // 60:02}:{int(time.time() - start_time) % 60:02}] [{func__name}()] [{category_map[category][0]}] {msg}"
)

# decorator to get function name because "traceback" module is not available in micropython
func__name__ = None


def get_func__name__(func):
    def wrapper(*args, **kwargs):
        global func__name__
        func__name__ = func.__name__
        return func(*args, **kwargs)

    return wrapper


# https://github.com/yuan-miranda/microfilesys/blob/main/microfilesys.py#L62
def microfilesys_rjust(string, width, fill_char=" "):
    """Returns a right-justified string."""
    if len(string) >= width:
        return string
    else:
        padding = fill_char * (width - len(string))
        return padding + string


def microfilesys_ljust(string, width, fill_char=" "):
    """Returns a left-justified string."""
    if len(string) >= width:
        return string
    else:
        padding = fill_char * (width - len(string))
        return string + padding


def led_on():
    led.value(1)


def led_off():
    led.value(0)


def led_toggle():
    led.value(not led.value())


@get_func__name__
def init_ap():
    ap = network.WLAN(network.AP_IF)
    ap.config(essid=ssid, password=password)
    ap.active(True)
    while not ap.active():
        pass
    log(func__name__, 1, f"Access point started at: {ap.ifconfig()}")
    return ap


async def init_server():
    await asyncio.start_server(handle_request, "0.0.0.0", port)
    while True:
        await asyncio.sleep(1)


def file_exists(path):
    try:
        os.stat(path)
        return True
    except:
        return False


def dir_exists(path):
    try:
        os.listdir(path)
        return True
    except:
        return False


def read_file(path):
    with open(path, "rb") as f:
        return f.read()


def get_content_type(path):
    if path.endswith(".html"):
        return "text/html"
    if path.endswith(".css"):
        return "text/css"
    if path.endswith(".js"):
        return "application/javascript"
    if path.endswith(".json"):
        return "application/json"
    if path.endswith(".svg"):
        return "image/svg+xml"
    return "text/plain"


@get_func__name__
async def send_response(writer, content_type, content):
    try:
        header = (
            "HTTP/1.1 200 OK\r\n"
            "Access-Control-Allow-Origin: *\r\n"
            f"Content-Type: {content_type}\r\n"
            f"Content-Length: {len(content)}\r\n"
            "\r\n"
        )
        writer.write(header.encode())
        await writer.drain()

        writer.write(content)
        await writer.drain()

        await writer.aclose()
    except Exception as e:
        log(func__name__, 3, f"Exception while sending response: {e}")


@get_func__name__
async def handle_request(reader, writer):
    global control_states
    try:
        request = await reader.read(1024)
        request = request.decode()

        try:
            request_line = request.split("\r\n")[0]
            request_type, request_path, _ = request_line.split(" ")
            log(func__name__, 1, f"Request: {request_type} {request_path}")
        except:
            request_path = "/"

        if request_path == "/":
            path = "static/html/index.html"
        elif "media" in request_path:
            path = request_path[1:]

        # /control/000000
        elif "/control/" in request_path:
            try:
                # take the string after /control/
                states = request_path.split("/control/")[-1]
                if len(states) != 6 or not states.isdigit():
                    raise Exception("Invalid control states format")

                control_states = states
                uart.write(f"{control_states}\n")

                await send_response(writer, "text/plain", "200 OK".encode())
                return
            except Exception as e:
                log(func__name__, 3, f"exception: {e}")
                await send_response(
                    writer, "text/plain", "500 Internal Server Error".encode()
                )
                return

        elif request_path == "/control-states":
            await send_response(writer, "text/plain", control_states.encode())
            return

        else:
            path = f"static{request_path}"

        if file_exists(path):
            content = read_file(path)
            content_type = get_content_type(path)
            await send_response(writer, content_type, content)
        else:
            await send_response(writer, "text/plain", "404 Not Found".encode())
    except Exception as e:
        log(func__name__, 3, f"exception: {e}")
        await send_response(writer, "text/plain", "500 Internal Server Error".encode())


async def main():
    init_ap()
    await init_server()


asyncio.run(main())
