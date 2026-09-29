# ==============================
# 全唐诗地图网站服务器
# ==============================

from http.server import HTTPServer, SimpleHTTPRequestHandler
import sqlite3
import json


DB_FILE = "comments.db"


# ==============================
# 创建数据库
# ==============================

def init_database():

    conn = sqlite3.connect(DB_FILE)

    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS comments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            place TEXT,
            longitude TEXT,
            latitude TEXT,
            content TEXT,
            time TEXT
        )
    """)

    conn.commit()
    conn.close()


# ==============================
# 网站服务器
# ==============================

class MyHandler(SimpleHTTPRequestHandler):

    # ==============================
    # 接收留言
    # ==============================

    def do_POST(self):

        if self.path == "/api/comments":

            length = int(
                self.headers.get("Content-Length", 0)
            )

            data = self.rfile.read(length)

            comment = json.loads(
                data.decode("utf-8")
            )

            conn = sqlite3.connect(DB_FILE)

            cursor = conn.cursor()

            cursor.execute("""
                INSERT INTO comments
                (
                    place,
                    longitude,
                    latitude,
                    content,
                    time
                )
                VALUES (?, ?, ?, ?, ?)
            """, (
                comment.get("place", ""),
                comment.get("longitude", ""),
                comment.get("latitude", ""),
                comment.get("content", ""),
                comment.get("time", "")
            ))

            conn.commit()
            conn.close()

            self.send_response(200)

            self.send_header(
                "Content-Type",
                "application/json; charset=utf-8"
            )

            self.end_headers()

            self.wfile.write(
                json.dumps({
                    "success": True
                }).encode("utf-8")
            )

            return

        self.send_error(404)


    # ==============================
    # 获取全部留言
    # ==============================

    def do_GET(self):

        if self.path == "/api/comments":

            conn = sqlite3.connect(DB_FILE)

            cursor = conn.cursor()

            cursor.execute("""
                SELECT
                    id,
                    place,
                    longitude,
                    latitude,
                    content,
                    time
                FROM comments
                ORDER BY id DESC
            """)

            rows = cursor.fetchall()

            conn.close()


            comments = []

            for row in rows:

                comments.append({

                    "id": row[0],
                    "place": row[1],
                    "longitude": row[2],
                    "latitude": row[3],
                    "content": row[4],
                    "time": row[5]

                })


            self.send_response(200)

            self.send_header(
                "Content-Type",
                "application/json; charset=utf-8"
            )

            self.end_headers()

            self.wfile.write(
                json.dumps(
                    comments,
                    ensure_ascii=False
                ).encode("utf-8")
            )

            return


        # 普通网页文件
        super().do_GET()


# ==============================
# 启动
# ==============================

init_database()

server = HTTPServer(
    ("localhost", 8000),
    MyHandler
)

print("全唐诗地图网站服务器已启动")
print("http://localhost:8000")

server.serve_forever()