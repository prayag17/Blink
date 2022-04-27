import QtWebEngine
// import QtWebEngine.WebEngineSettings
import QtWebChannel
import QtQuick.Window
import QtQuick.Controls

Window{
    id: mainWindow
    title: "Jellyfin Player"
    objectName: "mainWindow"
    minimumHeight: 720
    minimumWidth: 1280
    visible: true

    WebEngineView{
      id:webView
      url:"http://127.0.0.1:5000";
      width: mainWindow.width;
      height: mainWindow.height;
      anchors.fill: parent;
      settings.localStorageEnabled: true;
      settings.localContentCanAccessRemoteUrls: true;
      settings.localContentCanAccessFileUrls: true;
      settings.javascriptEnabled: true;
    }
    property QtObject webChannel: webView.webChannel
}