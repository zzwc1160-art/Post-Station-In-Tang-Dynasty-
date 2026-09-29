
const map = L.map("map").setView([34, 110], 4);


// ==============================
// 底图图层
// ==============================

// ① ArcGIS 灰色底图
const grayBase = L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}",
    {
        attribution: "Tiles © Esri – Esri, DeLorme, NAVTEQ",
        maxZoom: 16
    }
);

// ② OpenStreetMap 底图
const osmBase = L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19
    }
);

// 默认显示灰色底图
grayBase.addTo(map);

// 底图切换按钮
const baseMaps = {
    "灰色底图（ArcGIS）": grayBase,
    "OpenStreetMap": osmBase
};

const layerControl = L.control.layers(baseMaps, null, {
    position: "topright"
}).addTo(map);

// ==============================
// 读取 Data.xlsx
// ==============================

fetch("Data.xlsx?t=" + Date.now())
    .then(response => response.arrayBuffer())
    .then(buffer => {

        // ==============================
        // 读取 Excel
        // ==============================

        const workbook = XLSX.read(buffer, {
            type: "array"
        });

        // 获取第一个工作表
        const sheetName = workbook.SheetNames[0];

        const worksheet = workbook.Sheets[sheetName];


        // ==============================
        // 转换成 JavaScript 数据
        // ==============================

        const data = XLSX.utils.sheet_to_json(
            worksheet,
            {
                defval: ""
            }
        );


        console.log(
            "Excel读取成功,共有:",
            data.length,
            "条"
        );


        // ==============================
        // 遍历每一行
        // ==============================

        data.forEach(function(p) {

            const lng = parseFloat(p["经度"]);
            const lat = parseFloat(p["纬度"]);


            // 没有坐标则跳过
            if (isNaN(lat) || isNaN(lng)) {
                return;
            }


            // ==============================
            // 创建地图点
            // ==============================

            const marker = L.circleMarker(
                [lat, lng],
                {
                    radius: 6,
                    color: "#000000",
                    weight: 1,
                    fillColor: "#fa9600",
                    fillOpacity: 1
                }
            ).addTo(map);


            // ==============================
            // 点击点
            // ==============================

            marker.on("click", function() {

                const panel =
                    document.getElementById("info-panel");

                const content =
                    document.getElementById("info-content");


                content.innerHTML = `

                    <h2>
                        ${p["馆驿名称"] || "未命名地点"}
                    </h2>
                  
                    <div class="attribute">
                        <span>定位描述</span>
                        <p>
                            ${p["定位描述"] || "—"}
                        </p>
                    </div>

                    <div class="attribute">
                        <span>备注</span>
                        <p>
                            ${p["备注"] || "—"}
                        </p>
                    </div>

                    <div class="attribute">
                        <span>道</span>
                        <p>
                            ${p["道"] || "—"}
                        </p>
                    </div>

                    <div class="attribute">
                        <span>府/州</span>
                        <p>
                            ${p["府州"] || "—"}
                        </p>
                    </div>

                    <div class="attribute">
                        <span>县（相对于741年）</span>
                        <p>
                            ${p["县（相对于741年）"] || "—"}
                        </p>
                    </div>
                  
                    <div class="attribute">
                        <span>来源</span>
                        <p>
                            ${p["来源"] || "—"}
                        </p>
                    </div>

                    <div class="attribute">
                        <span>驿路名</span>
                        <p>
                            ${p["驿路名"] || "—"}
                        </p>
                    </div>

                    <div class="attribute">
                        <span>始建年</span>
                        <p>
                            ${p["始建年"] || "—"}
                        </p>
                    </div>

                     <div id="comment-box">

                        <h3>提交留言</h3>

                        <textarea
                            id="comment-input"
                            placeholder="请输入你对这个地点的意见或订误建议……"
                        ></textarea>

                        <button id="comment-submit">
                            提交留言
                        </button>

                        <p id="comment-status"></p>

                    </div>

                `;


                panel.classList.add("open");

                // ==============================
                // 提交留言到服务器
                // ==============================

                document
                    .getElementById("comment-submit")
                    .onclick = function() {

                        const input =
                            document.getElementById("comment-input");

                        const status =
                            document.getElementById("comment-status");

                        const comment =
                            input.value.trim();


                        // 没有输入内容
                        if (!comment) {

                            status.textContent =
                                "请先输入留言内容";

                            return;
                        }


                        // ==============================
                        // 准备留言数据
                        // ==============================

                        const data = {

                            place:
                                p["整理后的馆驿名称"] || "未命名地点",

                            longitude:
                                p["经度"] || "",

                            latitude:
                                p["纬度"] || "",

                            content:
                                comment,

                            time:
                                new Date().toLocaleString()

                        };


                        // ==============================
                        // 发送到服务器
                        // ==============================

                        fetch("/api/comments", {

                            method: "POST",

                            headers: {
                                "Content-Type": "application/json"
                            },

                            body: JSON.stringify(data)

                        })


                        // ==============================
                        // 处理服务器返回结果
                        // ==============================

                        .then(response => {

                            if (!response.ok) {

                                throw new Error(
                                    "服务器返回错误"
                                );

                            }

                            return response.json();

                        })


                        .then(result => {

                            if (result.success) {

                                // 清空输入框
                                input.value = "";

                                // 显示成功
                                status.textContent =
                                    "留言提交成功！";

                            }

                        })


                        .catch(error => {

                            console.error(
                                "留言提交失败：",
                                error
                            );

                            status.textContent =
                                "留言提交失败，请检查服务器是否运行。";

                        });

                    };

            });

        });

    })

    .catch(function(error) {

        console.error(
            "Data.xlsx 加载失败：",
            error
        );

    });


// ==============================
// 关闭右侧属性栏
// ==============================

document
    .getElementById("close-panel")
    .addEventListener("click", function() {

        document
            .getElementById("info-panel")
            .classList.remove("open");

    });

// ==============================
// 京都大学唐代交通线
// ==============================

map.createPane("tangTransportPane");
map.getPane("tangTransportPane").style.zIndex = 650;

fetch("京都大学唐代交通线矢量.geojson")
    .then(response => response.json())
    .then(data => {

        const tangTransport = L.geoJSON(data, {
            interactive: false,
            pane: "tangTransportPane",
            style: {
                color: "#8e8b8bf1",
                weight: 1
            }
        })

        layerControl.addOverlay(tangTransport, "唐代交通线");

    })
    .catch(error => {
        console.error("唐代交通线加载失败：", error);
    });

// ==============================
// 唐代州府边界
// ==============================

fetch("tang.geojson")
    .then(response => response.json())
    .then(data => {

        const tangPrefectures = L.geoJSON(data, {
            interactive: false,
            style: {
                color: "#000000",
                weight: 1,
                fillColor: "#ff7300",
                fillOpacity: 0
            }
        })

        layerControl.addOverlay(tangPrefectures, "唐代州府边界");

    })
    .catch(error => {
        console.error("唐代州府边界加载失败：", error);
    });