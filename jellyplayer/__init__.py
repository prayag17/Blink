__version__ = '0.1.0'

import sys,os,subprocess
from PySide6.QtWidgets import QApplication, QMainWindow, QWidget
from PySide6.QtCore import QUrl, Slot, QObject, QProcess, Qt, QCoreApplication
from PySide6.QtGui import QIcon, QPixmap
from PySide6.QtWebChannel import QWebChannel
from PySide6.QtQml import QQmlApplicationEngine
os.environ["PATH"] = os.path.dirname(__file__) + os.pathsep + os.environ["PATH"]
import mpv

QCoreApplication.setAttribute(Qt.AA_ShareOpenGLContexts)
app = QApplication(["--enable-smooth-scrolling", "--enable-gpu"])
print(os.path.dirname(__file__) + os.pathsep)

try:
    from ctypes import windll
    myappid = 'prayag17.jellyplayer.0.1.0'
    windll.shell32.SetCurrentProcessExplicitAppUserModelID(myappid)
except ImportError:
    pass

def restart():
    QApplication.quit()
    status = QProcess.startDetached(sys.executable, sys.argv)

class Backend(QObject):
    def restart(self):
        QApplication.quit()
        status = QProcess.startDetached(sys.executable, sys.argv)
        
    @Slot(str)
    def launchPlayer(self, videoUrl):
        import locale
        locale.setlocale(locale.LC_NUMERIC, 'C')
        playerwindow = PlayerWindow(videoUrl)
        window.hide()
        playerwindow.showMaximized()

class MainWin():
    def __init__(self):
        super().__init__();
        self.dirRaw = os.path.dirname(os.path.realpath(__file__))
        self.dir = self.dirRaw.replace("\\","/")
        self.view= QQmlApplicationEngine()
        
        app.setWindowIcon(QIcon(QPixmap(f"{self.dir}/assets/icon.png")))
        self.view.load(QUrl.fromLocalFile(f"{self.dir}/mainWindow.qml"))
        
        self.backend = Backend()
        self.channel = QWebChannel()
        self.channel.registerObject('backend', self.backend)
        
    def createPlayer(self, videoUrl):
        self.container = QWidget(self)
        self.setCentralWidget(self.container)
        self.container.setAttribute(Qt.WA_DontCreateNativeAncestors)
        self.container.setAttribute(Qt.WA_NativeWindow)
        player = mpv.MPV(wid=str(int(self.container.winId())),
                gpu_context="d3d11",
                hwdec="nvdec",
                log_handler=print,
                loglevel='debug')
        player.play(videoUrl)

class PlayerWindow(QMainWindow):
    def __init__(self,videoUrl):
        super().__init__()



frontendProcess = subprocess.Popen(f'{sys.executable} {os.path.dirname(__file__)}/jellyplayer-jellyfin-vue/frontend/dist/server.py', shell=True)
window = MainWin()

print(window.dir)
exitApp = app.exec()
os.kill(frontendProcess.pid, 0)
sys.exit(exitApp)