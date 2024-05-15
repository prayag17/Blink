![Banner](https://i.imgur.com/4LECQq3.png)
<div align="center">
<img alt="GitHub Release" src="https://img.shields.io/github/v/release/prayag17/JellyPlayer?sort=date&display_name=tag&style=for-the-badge&logo=data%3Aimage%2Fsvg%2Bxml%3Bbase64%2CPHN2ZyB3aWR0aD0iODc4IiBoZWlnaHQ9IjEwMTIiIHZpZXdCb3g9IjAgMCA4NzggMTAxMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik00MzguODA5IDUwNkwzNS40MDQ4IDczOC45MDZMNDM4LjgwOSA5NzEuODEyTDg0Mi4yMTQgNzM4LjkwNlYyNzMuMDk0TDQzOC44MDkgNDAuMTg4NUwzNS40MDQ4IDI3My4wOTRMNDM4LjgwOSA1MDZaTTQzOC44MDkgMEw4NzcuMDE4IDI1M1Y3NTlMNDM4LjgwOSAxMDEyTDAuNjAwNTg2IDc1OVY3MTguODEyVjI5My4xODhWMjUzTDQzOC44MDkgMFoiIGZpbGw9IndoaXRlIi8%2BCjwvc3ZnPgo%3D&labelColor=000&link=https%3A%2F%2Fgithub.com%2Fprayag17%2FJellyPlayer%2Freleases%2Flatest">
<img alt="GitHub Repo stars" src="https://img.shields.io/github/stars/prayag17/JellyPlayer?style=for-the-badge&logo=github&labelColor=000&link=https%3A%2F%2Fgithub.com%2Fprayag17%2FJellyPlayer%2Fstargazers">
<img alt="GitHub License" src="https://img.shields.io/github/license/prayag17/JellyPlayer?style=for-the-badge&labelColor=000">  
<img alt="GitHub Actions Workflow Status" src="https://img.shields.io/github/actions/workflow/status/prayag17/JellyPlayer/continuous-integration.yml?style=for-the-badge&logo=github&label=CI&labelColor=000&link=https%3A%2F%2Fgithub.com%2Fprayag17%2FJellyPlayer%2Factions%2Fworkflows%2Fcontinuous-integration.yml">
</div>

### 

> [!IMPORTANT]
> **JellyPlayer** has been renamed to **Blink** to avoid confusion with first party Jellyfin apps

## 📝 Prerequisites

- Nodejs (≥19.1.0)
- Rust (≥1.76.0)
- Visual Studio C++ Build tools
- [pnpm](https://pnpm.io/)

## ℹ️ Getting started

- Install Nodejs, pnpm and Rust.
  > **Note** : Install Rust from <https://www.rust-lang.org/learn/get-started>
- install depencies using pnpm:

  ```shell
  pnpm install
  ```

## 🛠️ Development

- Running the app:

  ```shell
  pnpm run tauri dev
  ```

- Building the app:

  ```shell
  pnpm run tauri build
  ```

- other commands can be found inside the `"scripts"` inside [package.json](https://github.com/prayag17/JellyPlayer/blob/main/package.json)

## 💻 Contribution

- Checkout `issues` to see currently worked on features and bugs
- Add features or fix bugs
- Create a pull request

## ✨ Features

- Play any media supported by the system (DirectPlay most files on windows, mac and linux)
- Clean and minimal UI.
- Multi Jellyfin server support
- Cross Platform
- Mediainfo recognition (DolbyVision, DolbyAtoms, Dts, Hdr10+, and more...)
- Sort/Filter library items
- Queue playback support 

## 📷 Screenshots

- Home
  ![home](https://github.com/prayag17/JellyPlayer/assets/55829513/ffda4dc5-c147-4278-a232-bb58b1051501)
- Title Page - Movie
  ![title-movie](https://github.com/prayag17/JellyPlayer/assets/55829513/1086f51b-a743-46e4-a761-c9f70a0d21bd)
- Title Page - Show
  ![title-show](https://github.com/prayag17/JellyPlayer/assets/55829513/23b42d4a-2892-497b-aa32-0ae73e300655)
- Episode List
  ![show-episodes](https://github.com/prayag17/JellyPlayer/assets/55829513/9fe69ddd-ffa3-4a6b-a2a7-c2e639b6b2e4)
- Video Player
  ![playback-video](https://github.com/prayag17/JellyPlayer/assets/55829513/a84850e6-3be7-41c5-8cf7-e14c3cd0df29)
- About Dialog
  ![about](https://github.com/prayag17/JellyPlayer/assets/55829513/fc3adf83-87fd-4901-8abd-39b148418f8d)

## 📃 Roadmap

- Checkout [GitHub Project](https://github.com/users/prayag17/projects/3)
  

## 🎊 Special thanks to

- [@ferferga](https://github.com/ferferga) for helping in development behind the scenes.
- All contributors of [jellyfin/jellyfin-vue](https://github.com/jellyfin/jellyfin-vue).
- And also [@jellyfin](https://github.com/jellyfin/) for creating the main service
