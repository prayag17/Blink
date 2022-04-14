# JellyPlayer

### Modern Jellyfin Client

## Installation

- Install Requirements:
  - Install Python 3
  - Install dependencies

    ```console
    pip3 install -r requirements.txt --default-timeout=1000 
    ```

- Run App:
  
  - Complie Renderer Files(html,js,css):

    ```console
    pyside6-rcc main.qrc -o renderer.py 
    ```

  - Run JellyPlayer:

    ```console
    python main.py
    ```

- Build EXE:

  ```console
  pyinstaller --clean main.spec
  ```

  The .exe file will generate at dist/JellyPlayer
