# JellyPlayer

## Modern Jellyfin Client

## Installation

- Install Requirements:
  - Install Python 3
  - Install dependencies
    - Install node deps for frontend, go to JellyPlayer-FrontEnd dir and run the following command

      ```console
      npm install
      ```

    - Install Python deps

      ```console
      pip3 install -r requirements.txt --default-timeout=1000
      ```

- Run App:
  
  - Complie Renderer Files(html,js,css):\
    Go to JellyPlayer-FrontEnd dir and run.\
    **Note: on windows use WSL to compile**

    ```console
    npm run build 
    ```

  - Run JellyPlayer:

    ```console
    python3 main.py
    ```

<!-- - Build EXE:

  ```console
  pyinstaller --clean main.spec
  ```

  The .exe file will generate at dist/JellyPlayer -->

## Roadmap to Alpha 1

![roadmap alpha 1](https://i.imgur.com/lBd6etl_d.webp?maxwidth=640&shape=thumb&fidelity=medium)
