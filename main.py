import sys,os,requests,subprocess,time,signal
from localStoragePy import localStoragePy
from PySide6.QtWidgets import QApplication, QMainWindow, QWidget, QSlider, QVBoxLayout, QFrame, QHBoxLayout, QPushButton
from PySide6.QtCore import QUrl, Slot, QObject, QProcess, Qt, QTimer
from PySide6.QtGui import QIcon, QPixmap, QPalette, QColor, QAction
from PySide6.QtWebEngineWidgets import QWebEngineView
from PySide6.QtWebEngineCore import QWebEngineSettings
from PySide6.QtWebChannel import QWebChannel
from PySide6.QtQuick import QQuickView
from PySide6.QtQml import QQmlApplicationEngine
os.environ["PATH"] = os.path.dirname(__file__) + os.pathsep + os.environ["PATH"]
import mpv

app = QApplication(["--disable-gpu-driver-bug-workarounds", "--enable-smooth-scrolling"])
print(os.path.dirname(__file__) + os.pathsep)

try:
    from ctypes import windll
    myappid = 'prayag17.jellyplayer.0.1.0'
    windll.shell32.SetCurrentProcessExplicitAppUserModelID(myappid)
except ImportError:
    pass

storage = localStoragePy('prayag.jellyplayer.app', 'sqlite')

def restart():
    QApplication.quit()
    status = QProcess.startDetached(sys.executable, sys.argv)

class Backend(QObject):
    @Slot(result=str)
    def onStartup(self):
        if storage.getItem("serverGo") == "True":
            try:
                ping = requests.get(f"{storage.getItem('server')}/System/Ping")
                if ping.content == b'"Jellyfin Server"':
                    if storage.getItem("openHome") == "True":
                        return "openHomeTrue"
                    else:
                        return "serverGoTrue"
            except:
                
                return "serverOffline"
        else:
            return "serverGoFalse"

    @Slot(result=list)
    def getAuthinfo(self):
        return [storage.getItem("UserName"), storage.getItem("UserPw")]
    
    @Slot(str, result=bool)
    def saveServer(self, data):
        ping = requests.get(f"{data}/System/Ping")
        if ping.content == b'"Jellyfin Server"':
            storage.setItem('server', data)
            storage.setItem("serverGo", True)
            return True
        else:
            storage.setItem("serverGo", False)
            return False

    @Slot(str, result=bool)
    def getValuesFromDatabaseBool(self, object):
        print(f"Object: {object}")
        item = storage.getItem(object)
        print(item)
        if item == "True":
            return True
        elif item == "False":
            return False
    
    @Slot(str, result=str)
    def getValuesFromDatabaseStr(self, object):
        print(f"Object: {object}")
        item = storage.getItem(object)
        print(item)
        return item
    
    @Slot(str, str)
    def setAuthInfoDatabase(self, userName, Pw):
        print(f"User: {userName}, Password: {Pw}")
        storage.setItem("UserName", userName)
        storage.setItem("UserPw", Pw)
        storage.setItem("openHome", True)
        
    @Slot()
    def clearStorage(self):
        storage.clear()
        restart()
        
    @Slot()
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
        
        app.setWindowIcon(QIcon(QPixmap("./assets/icon.png")))
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



frontendProcess = subprocess.Popen(f'{sys.executable} {os.path.dirname(__file__)}/JellyPlayer-FrontEnd/frontend/dist/server.py', shell=True)
window = MainWin()

print(window.dir)
exitApp = app.exec()
os.kill(frontendProcess.pid, 0)
sys.exit(exitApp)