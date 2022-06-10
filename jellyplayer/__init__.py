from mpv import MPV, MpvRenderContext, MpvGlGetProcAddressFn
__version__ = '0.1.0'

import sys
import os
import subprocess
import platform
from signal import SIGTERM, signal
from PySide6.QtWidgets import QApplication, QMainWindow, QWidget
from PySide6.QtCore import QUrl, Slot, QObject, QProcess, Qt, QCoreApplication, Signal, QSize
from PySide6.QtGui import QIcon, QPixmap, QOpenGLContext
from PySide6.QtWebChannel import QWebChannel
from PySide6.QtWebEngineWidgets import QWebEngineView
from PySide6.QtWebEngineCore import QWebEngineSettings
from PySide6.QtWebEngineQuick import QtWebEngineQuick
from PySide6.QtQuick import QQuickFramebufferObject, QQuickView, QQuickItem
from PySide6.QtOpenGL import QOpenGLFramebufferObject
from PySide6.QtOpenGLWidgets import QOpenGLWidget
from PySide6.QtQml import QQmlApplicationEngine, QQmlComponent, qmlRegisterType
from ctypes import windll, cast, c_void_p

# if (platform.system() == "Windows"):
#     from OpenGL import GL, WGL
# else:
#     from OpenGL import GL, GLX

os.environ["PATH"] = os.path.dirname(
    __file__) + os.pathsep + os.environ["PATH"]

QCoreApplication.setAttribute(Qt.AA_ShareOpenGLContexts)
app = QApplication(["--enable-smooth-scrolling", "--enable-gpu"])
print(os.path.dirname(__file__) + os.pathsep)

try:
    myappid = 'prayag17.jellyplayer.0.1.0'
    windll.shell32.SetCurrentProcessExplicitAppUserModelID(myappid)
except ImportError:
    pass


def restart():
    QApplication.quit()
    status = QProcess.startDetached(sys.executable, sys.argv)


class Backend(QObject):
    def __init__(self, player):
        self.player = player

    def restart(self):
        QApplication.quit()
        status = QProcess.startDetached(sys.executable, sys.argv)

    @Slot(str)
    def play(self, url):
        self.player.play(url)

    @Slot(int)
    def setTime(self, time):
        self.player.setTime(time)


class MainWin(QMainWindow):
    def __init__(self):
        super().__init__()
        self.dirRaw = os.path.dirname(os.path.realpath(__file__))
        self.dir = self.dirRaw.replace("\\", "/")
        self.view = QWebEngineView()
        self.view.load(QUrl("http://localhost:3000"))
        # self.view.load(QUrl("http://localhost:2703"))
        self.view.raise_()
        self.setCentralWidget(self.view)
        self.setWindowIcon(QIcon(QPixmap(f"{self.dir}/assets/icon.png")))

        self.view.settings().setAttribute(QWebEngineSettings.JavascriptEnabled, True)
        self.view.settings().setAttribute(QWebEngineSettings.PluginsEnabled, True)
        self.view.settings().setAttribute(
            QWebEngineSettings.LocalContentCanAccessRemoteUrls, True)
        self.view.settings().setAttribute(QWebEngineSettings.LocalStorageEnabled, True)
        self.view.settings().setAttribute(
            QWebEngineSettings.LocalContentCanAccessFileUrls, True)
        self.view.settings().setAttribute(QWebEngineSettings.ScrollAnimatorEnabled, True)

        self.view.loadFinished.connect(self.handleLoaded)

        self.inspector = QWebEngineView()
        self.inspector.setWindowTitle("Inspector")

        self.backend = Backend(self.playerWid)
        self.channel = QWebChannel()
        self.channel.registerObject('backend', self.backend)

        self.playerWid = QWidget(self)
        self.playerWid.setMinimumHeight(self.view.height)
        self.playerWid.setMinimumWidth(self.view.width)
        self.playerWid.setAttribute(Qt.WA_DontCreateNativeAncestors)
        self.playerWid.setAttribute(Qt.WA_NativeWindow)
        self.playerWid.lower()
        self.player = MPV(wid=str(int(self.playerWid.winId())),
                          gpu_context="d3d11",
                          hwdec="nvdec",
                          log_handler=print,
                          loglevel='debug')

    def handleLoaded(self, ok):
        if ok:
            self.view.page().setDevToolsPage(self.inspector.page())
            self.inspector.show()


# frontend = subprocess.Popen(f"python {os.path.dirname(os.path.realpath(__file__))}/jellyplayer-jellyfin-vue/frontend/dist/server.py", shell=True)
window = MainWin()
window.showMaximized()
exitApp = app.exec()
# frontend.kill()
sys.exit(exitApp)
