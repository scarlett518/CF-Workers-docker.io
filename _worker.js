// _worker.js

// Docker镜像仓库主机地址
let hub_host = 'registry-1.docker.io';
// Docker认证服务器地址
const auth_url = 'https://auth.docker.io';
// 自定义的工作服务器地址
let workers_url = 'https://你的域名';

// 根据主机名选择对应的上游地址
function routeByHosts(host) {
    // 定义路由表
    const routes = {
        // 生产环境
        "quay": "quay.io",
        "gcr": "gcr.io",
        "k8s-gcr": "k8s.gcr.io",
        "k8s": "registry.k8s.io",
        "ghcr": "ghcr.io",
        "cloudsmith": "docker.cloudsmith.io",
        
        // 测试环境
        "test": "registry-1.docker.io",
    };

    if (host in routes) return [ routes[host], false ];
    else return [ hub_host, true ];
}

/** @type {RequestInit} */
const PREFLIGHT_INIT = {
    // 预检请求配置
    headers: new Headers({
        'access-control-allow-origin': '*', // 允许所有来源
        'access-control-allow-methods': 'GET,POST,PUT,PATCH,TRACE,DELETE,HEAD,OPTIONS', // 允许的HTTP方法
        'access-control-max-age': '1728000', // 预检请求的缓存时间
    }),
}

/**
 * 构造响应
 * @param {any} body 响应体
 * @param {number} status 响应状态码
 * @param {Object<string, string>} headers 响应头
 */
function makeRes(body, status = 200, headers = {}) {
    headers['access-control-allow-origin'] = '*' // 允许所有来源
    return new Response(body, { status, headers }) // 返回新构造的响应
}

/**
 * 构造新的URL对象
 * @param {string} urlStr URL字符串
 */
function newUrl(urlStr) {
    try {
        return new URL(urlStr) // 尝试构造新的URL对象
    } catch (err) {
        return null // 构造失败返回null
    }
}

function isUUID(uuid) {
    // 定义一个正则表达式来匹配 UUID 格式
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[4][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    
    // 使用正则表达式测试 UUID 字符串
    return uuidRegex.test(uuid);
}

async function nginx() {
    const text = `
    <!DOCTYPE html>
    <html>
    <head>
    <title>Welcome to nginx!</title>
    <style>
        body {
            width: 35em;
            margin: 0 auto;
            font-family: Tahoma, Verdana, Arial, sans-serif;
        }
    </style>
    </head>
    <body>
    <h1>Welcome to nginx!</h1>
    <p>If you see this page, the nginx web server is successfully installed and
    working. Further configuration is required.</p>
    
    <p>For online documentation and support please refer to
    <a href="http://nginx.org/">nginx.org</a>.<br/>
    Commercial support is available at
    <a href="http://nginx.com/">nginx.com</a>.</p>
    
    <p><em>Thank you for using nginx.</em></p>
    </body>
    </html>
    `;
    return text;
}

async function generateHelpHTML(env) {
    const D1 = env.D1 || 'default-d1';
    const D2 = env.D2 || 'default-d2';
    const D3 = env.D3 || 'default-d3';
    const D4 = env.D4 || 'default-d4';
    const D5 = env.D5 || 'default-d5';

    const workersHost = `${D1}, ${D2}, ${D3}, ${D4}, ${D5}`;

    return `
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>镜像加速说明</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                margin: 0;
                padding: 20px;
                background-image: url('https://image.dooo.ng/c/2024/06/19/6672490bad599.webp'); /* Replace with your image path */
                background-size: cover;
                background-position: center;
                background-repeat: no-repeat;
                background-attachment: fixed;
            }
            .container {
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
                background: rgba(255, 255, 255, 0.8);
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }
            h1 {
                font-size: 2em;
                margin-bottom: 0.5em;
                color: #007aff;
            }
            p {
                margin-bottom: 1em;
            }
            pre {
                background: #2d2d2d;
                color: #f8f8f2;
                padding: 20px;
                border-radius: 8px;
                overflow-x: auto;
                position: relative;
            }
            pre::before {
                content: " ";
                display: block;
                position: absolute;
                top: 10px;
                left: 10px;
                width: 12px;
                height: 12px;
                background: #ff5f56;
                border-radius: 50%;
                box-shadow: 20px 0 0 #ffbd2e, 40px 0 0 #27c93f;
            }
            code {
                font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace;
                font-size: 0.875em;
            }
            .copy-button {
                position: absolute;
                top: 10px;
                right: 10px;
                background: #007aff;
                color: white;
                border: none;
                padding: 5px 10px;
                border-radius: 5px;
                cursor: pointer;
                opacity: 0;
                transition: opacity 0.3s;
            }
            pre:hover .copy-button {
                opacity: 1;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <center><h1>镜像加速说明</h1></center>
            <center><h4>个人自建，请勿随意分享，导致资源滥用无法使用</h4></center>
            <h3>为了加速镜像拉取，你可以使用以下命令设置 registry mirror:</h3>
            <pre><code>
sudo mkdir -p /etc/docker
sudo tee /etc/docker/daemon.json <<-'EOF'
{
  "registry-mirrors": [
                        "https://${D1}",
                        "https://${D2}",
                        "https://${D3}",
                        "https://${D4}",
                        "https://${D5}"
                      ]
}
EOF
sudo systemctl daemon-reload
sudo systemctl restart docker</code><button class="copy-button" onclick="copyCode(this)">复制代码</button></pre>
            <h3>用法:</h3>
            <p>原拉取镜像命令</p>
            <pre><code>
docker pull library/alpine:latest</code><button class="copy-button" onclick="copyCode(this)">复制代码</button></pre>
            <h3>加速拉取镜像命令</h3>
            <pre><code>
docker pull ${D1}/library/alpine:latest</code><button class="copy-button" onclick="copyCode(this)">复制代码</button></pre>
        </div>
        <script>
            function copyCode(button) {
                const code = button.previousSibling;
                const textArea = document.createElement('textarea');
                textArea.value = code.textContent;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                button.textContent = '已复制';
                setTimeout(() => {
                    button.textContent = '复制代码';
                }, 2000);
            }
        </script>
    </body>
    </html>
    `;
}

export default {
    async fetch(request, env, ctx) {
        const getReqHeader = (key) => request.headers.get(key); // 获取请求头

        let url = new URL(request.url); // 解析请求URL
        workers_url = `https://${url.hostname}`;
        const pathname = url.pathname;
        const hostname = url.searchParams.get('hubhost') || url.hostname; 
        const hostTop = hostname.split('.')[0];// 获取主机名的第一部分
        const checkHost = routeByHosts(hostTop);
        hub_host = checkHost[0]; // 获取上游地址
        const fakePage = checkHost[1];
        console.log(`域名头部: ${hostTop}\n反代地址: ${hub_host}\n伪装首页: ${fakePage}`);
        const isUuid = isUUID(pathname.split('/')[1].split('/')[0]);
        
        const conditions = [
            isUuid,
            pathname.includes('/_'),
            pathname.includes('/r'),
            pathname.includes('/v2/user'),
            pathname.includes('/v2/orgs'),
            pathname.includes('/v2/_catalog'),
            pathname.includes('/v2/categories'),
            pathname.includes('/v2/feature-flags'),
            pathname.includes('search'),
            pathname.includes('source'),
            pathname === '/',
            pathname === '/favicon.ico',
            pathname === '/auth/profile',
        ];

        if (conditions.some(condition => condition) && (fakePage === true || hostTop == 'docker')) {
            if (env.URL302){
                return Response.redirect(env.URL302, 302);
            } else if (env.URL){
                if (env.URL.toLowerCase() == 'nginx'){
                    //首页改成一个nginx伪装页
                    return new Response(await nginx(), {
                        headers: {
                            'Content-Type': 'text/html; charset=UTF-8',
                        },
                    });
                } else if (env.URL.toLowerCase() == 'help') {
                    // 返回帮助页
                    return new Response(await generateHelpHTML(env), {
                        headers: {
                            'Content-Type': 'text/html; charset=UTF-8',
                        },
                    });
                } else {
                    return fetch(new Request(env.URL, request));
                }
            }
            
            const newUrl = new URL("https://registry.hub.docker.com" + pathname + url.search);

            // 复制原始请求的标头
            const headers = new Headers(request.headers);

            // 确保 Host 头部被替换为 hub.docker.com
            headers.set('Host', 'registry.hub.docker.com');

            const newRequest = new Request(newUrl, {
                method: request.method,
                headers: headers,
                body: request.method !== 'GET' && request.method !== 'HEAD' ? await request.blob() : null,
                redirect: 'follow'
            });

            return fetch(newRequest);
        }

        // 修改包含 %2F 和 %3A 的请求
        if (!/%2F/.test(url.search) && /%3A/.test(url.toString())) {
            let modifiedUrl = url.toString().replace(/%3A(?=.*?&)/, '%3Alibrary%2F');
            url = new URL(modifiedUrl);
            console.log(`handle_url: ${url}`);
        }

        // 处理token请求
        if (url.pathname.includes('/token')) {
            let token_parameter = {
                headers: {
                    'Host': 'auth.docker.io',
                    'User-Agent': getReqHeader("User-Agent"),
                    'Accept': getReqHeader("Accept"),
                    'Accept-Language': getReqHeader("Accept-Language"),
                    'Accept-Encoding': getReqHeader("Accept-Encoding"),
                    'Connection': 'keep-alive',
                    'Cache-Control': 'max-age=0'
                }
            };
            let token_url = auth_url + url.pathname + url.search;
            return fetch(new Request(token_url, request), token_parameter);
        }

        // 修改 /v2/ 请求路径
        if (/^\/v2\/[^/]+\/[^/]+\/[^/]+$/.test(url.pathname) && !/^\/v2\/library/.test(url.pathname)) {
            url.pathname = url.pathname.replace(/\/v2\//, '/v2/library/');
            console.log(`modified_url: ${url.pathname}`);
        }

        // 更改请求的主机名
        url.hostname = hub_host;

        // 构造请求参数
        let parameter = {
            headers: {
                'Host': hub_host,
                'User-Agent': getReqHeader("User-Agent"),
                'Accept': getReqHeader("Accept"),
                'Accept-Language': getReqHeader("Accept-Language"),
                'Accept-Encoding': getReqHeader("Accept-Encoding"),
                'Connection': 'keep-alive',
                'Cache-Control': 'max-age=0'
            },
            cacheTtl: 3600 // 缓存时间
        };

        // 添加Authorization头
        if (request.headers.has("Authorization")) {
            parameter.headers.Authorization = getReqHeader("Authorization");
        }

        // 发起请求并处理响应
        let original_response = await fetch(new Request(url, request), parameter);
        let original_response_clone = original_response.clone();
        let original_text = original_response_clone.body;
        let response_headers = original_response.headers;
        let new_response_headers = new Headers(response_headers);
        let status = original_response.status;

        // 修改 Www-Authenticate 头
        if (new_response_headers.get("Www-Authenticate")) {
            let auth = new_response_headers.get("Www-Authenticate");
            let re = new RegExp(auth_url, 'g');
            new_response_headers.set("Www-Authenticate", response_headers.get("Www-Authenticate").replace(re, workers_url));
        }

        // 处理重定向
        if (new_response_headers.get("Location")) {
            return httpHandler(request, new_response_headers.get("Location"));
        }

        // 返回修改后的响应
        let response = new Response(original_text, {
            status,
            headers: new_response_headers
        });
        return response;
    }
};

/**
 * 处理HTTP请求
 * @param {Request} req 请求对象
 * @param {string} pathname 请求路径
 */
function httpHandler(req, pathname) {
    const reqHdrRaw = req.headers;

    // 处理预检请求
    if (req.method === 'OPTIONS' &&
        reqHdrRaw.has('access-control-request-headers')
    ) {
        return new Response(null, PREFLIGHT_INIT);
    }

    let rawLen = '';

    const reqHdrNew = new Headers(reqHdrRaw);

    const refer = reqHdrNew.get('referer');

    let urlStr = pathname;

    const urlObj = newUrl(urlStr);

    /** @type {RequestInit} */
    const reqInit = {
        method: req.method,
        headers: reqHdrNew,
        redirect: 'follow',
        body: req.body
    };
    return proxy(urlObj, reqInit, rawLen);
}

/**
 * 代理请求
 * @param {URL} urlObj URL对象
 * @param {RequestInit} reqInit 请求初始化对象
 * @param {string} rawLen 原始长度
 */
async function proxy(urlObj, reqInit, rawLen) {
    const res = await fetch(urlObj.href, reqInit);
    const resHdrOld = res.headers;
    const resHdrNew = new Headers(resHdrOld);

    // 验证长度
    if (rawLen) {
        const newLen = resHdrOld.get('content-length') || '';
        const badLen = (rawLen !== newLen);

        if (badLen) {
            return makeRes(res.body, 400, {
                '--error': `bad len: ${newLen}, except: ${rawLen}`,
                'access-control-expose-headers': '--error',
            });
        }
    }
    const status = res.status;
    resHdrNew.set('access-control-expose-headers', '*');
    resHdrNew.set('access-control-allow-origin', '*');
    resHdrNew.set('Cache-Control', 'max-age=1500');

    // 删除不必要的头
    resHdrNew.delete('content-security-policy');
    resHdrNew.delete('content-security-policy-report-only');
    resHdrNew.delete('clear-site-data');

    return new Response(res.body, {
        status,
        headers: resHdrNew
    });
}
