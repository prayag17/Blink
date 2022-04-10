import sys,os,requests
from localStoragePy import localStoragePy
from PySide6.QtWidgets import QApplication, QMainWindow
from PySide6.QtCore import QUrl, Slot, QObject, QProcess
from PySide6.QtGui import QIcon, QPixmap
from PySide6.QtWebEngineWidgets import QWebEngineView
from PySide6.QtWebEngineCore import QWebEngineSettings
from PySide6.QtWebChannel import QWebChannel
import renderer
app = QApplication(["--enable-smooth-scrolling"])
os.environ['QTWEBENGINE_REMOTE_DEBUGGING'] = "9000"

try:
    from ctypes import windll
    myappid = 'prayag17.jellyplayer.0.1.0'
    windll.shell32.SetCurrentProcessExplicitAppUserModelID(myappid)
except ImportError:
    pass

storage = localStoragePy('prayag.jellyplayer.app', 'sqlite')
print(f"Server Url:{storage.getItem('server')}")
print([storage.getItem("UserName"), storage.getItem("UserPw"), storage.getItem("openHome")])


def restart():
    QApplication.quit()
    status = QProcess.startDetached(sys.executable, sys.argv)

class Backend(QObject):
    @Slot(result=str)
    def onStartup(self):
        if storage.getItem("serverGo") == "True":
            ping = requests.get(f"{storage.getItem('server')}/System/Ping")
            if ping.content == b'"Jellyfin Server"':
                if storage.getItem("openHome") == "True":
                    return "openHomeTrue"
                else:
                    return "serverGoTrue"
            else:
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

class LoginWin(QMainWindow):
    def __init__(self):
        super().__init__()
        
        self.dir = os.path.dirname(os.path.abspath(__file__))
        self.view= QWebEngineView(self)
        self.setCentralWidget(self.view)
        # self.setWindowIcon()
        
        self.view.settings().setAttribute(QWebEngineSettings.JavascriptEnabled, True)
        self.view.settings().setAttribute(QWebEngineSettings.PluginsEnabled, True)
        self.view.settings().setAttribute(QWebEngineSettings.LocalContentCanAccessRemoteUrls, True)
        self.view.settings().setAttribute(QWebEngineSettings.ScrollAnimatorEnabled, True)
        
        self.setWindowTitle('JellyPlayer')
        self.setWindowIcon(QIcon(QPixmap(":/assets/icon.png")))
        self.view.load(QUrl("qrc:/renderer/html/main.html"))
        self.view.loadFinished.connect(self.handleLoaded)
        
        self.inspector = QWebEngineView()
        self.inspector.setWindowTitle("Inspector")
        self.inspector.load(QUrl("http://127.0.0.1:9000"))
        
        self.backend = Backend()
        self.channel = QWebChannel()
        self.channel.registerObject('backend', self.backend)
        self.view.page().setWebChannel(self.channel)
        
    def handleLoaded(self, ok):
        if ok:
            self.view.page().setDevToolsPage(self.inspector.page())
            self.inspector.show()

window = LoginWin()
window.showMaximized()

sys.exit(app.exec())