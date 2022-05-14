import QtWebEngine
import QtWebChannel
import QtQuick
import QtQuick.Controls

import WebView

Item{
    id: window
    objectName: "window"
    // minimumHeight: 720
    // minimumWidth: 1280
    // visible: true

    // QtObject{
    //   id:mpvComObj
    //   WebChannel.id: backend
    //   function createMpv(url) {
    //     video.play(url)
    //   }
    // }

    // MpvObject{
    //   id:video;
    //   anchors.fill: parent
    // }

    // WebChannel{
    //   id: channel
    //   registeredObjects: [mpvComObj]
    // }

    WebView {
      id:webView;
      visible: true;
      width: mainWindow.width;
      height: mainWindow.height;
      anchors.fill: parent;
    }
    // property QtObject webChannel: webView.webChannel
}