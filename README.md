<p align="center">
	<img src="https://nginxproxymanager.com/github.png">
	<br><br>
	<img src="https://img.shields.io/badge/version-2.14.0-green.svg?style=for-the-badge">
	<a href="https://hub.docker.com/repository/docker/mcn11415/nginx-proxy-manager">
		<img src="https://img.shields.io/docker/stars/mcn11415/nginx-proxy-manager.svg?style=for-the-badge">
	</a>
	<a href="https://hub.docker.com/repository/docker/mcn11415/nginx-proxy-manager">
		<img src="https://img.shields.io/docker/pulls/mcn11415/nginx-proxy-manager.svg?style=for-the-badge">
	</a>
</p>

本项目作为一个开箱即用的预构建 Docker 镜像提供，让你能够轻松将请求反向代理到家庭网络或其他地方的网站。它原生内置了免费的 SSL 证书申请与续签功能，你甚至完全不需要精通 Nginx 或 Let's Encrypt 就能轻松上手。

- [快速搭建](#快速搭建)
- [完整安装指南](https://nginxproxymanager.com/setup/)
- [界面截图](https://nginxproxymanager.com/screenshots/)

## 项目初衷

我创建这个项目的初衷是为了满足个人的需求——为用户提供一种极其简单的方式，通过带有 SSL 卸载功能的方式来完成主机的反向代理。它必须简单到连猴子都可以操作。这个初衷至今未变，虽然有些高级选项可供选择，但它们都是可选的。项目的核心理念就是尽可能的简单，从而降低使用门槛。

<a href="https://www.buymeacoffee.com/jc21" target="_blank"><img src="http://public.jc21.com/github/by-me-a-coffee.png" alt="Buy Me A Coffee" style="height: 51px !important;width: 217px !important;" ></a>


## 核心功能

- 基于 [Tabler](https://tabler.github.io/) 打造的精美且安全的后台管理界面
- 简单即可创建转发域名、重定向、Stream 流转发和 404 主机，完全无需了解 Nginx 配置原理
- 使用 Let's Encrypt 颁发的免费 SSL 证书，或可提供自定义的 SSL 证书
- 为你的代理主机提供访问列表控制（Access Lists）和基础 HTTP 身份认证
- 为高级用户提供强大的自定义 Nginx 配置能力
- 用户管理、权限划分和独立的审核日志

## 🚀 本次二开增强功能 (Enhanced Features)
基于原版进行了深度强化，以解决复杂生产环境和外部代理中的痛点：
- **真正的负载均衡机制**：引入上游节点池配置，支持异构协议中转（单个代理下同时混用 HTTP/HTTPS 上游节点）。只需在界面动态添加上游节点并指定轮询规则。
- **一键目标域名覆写 (Override Host)**：有效突破由于防火墙（比如 Cloudflare、Zeabur 等外部边缘网关）强制校验所导致的 `400 Bad Request` 和 `502 Bad Gateway` 反代死锁冲突。后台利用 **OpenResty Lua 模块** 拦截篡改 Host 标头同时实现 SNI 透传伪装。单节点与负载均衡模式均全线兼容。
- **配置生成免疫与重构**：修复原版存在的模板逻辑 (LiquidJS) 缺陷，防止误输入导致的配置回滚陷阱。

::: warning
从 2.14+ 版本开始，不再支持 `armv7` 架构。这是因为 Node.js 官方已经放弃了对 armhf 的支持。如果你仍需在上述环境中运行，请使用 `2.13.7` 这个镜像标签。
:::

## 托管你的家庭网络服务

我不想在这里涉及过多细节，但对于刚接触内网穿透或家庭自托管（Self-hosted）世界的新手，这里有一些基本流程：

1. 你的家用路由器里通常会有一个叫“端口转发（Port Forwarding）”的设置部分。登录你的路由器并找到它。
2. 添加端口转发，将端口 `80` 和 `443` 转发到托管本项目的服务器 IP。
3. 配置你的域名解析信息，让它指向你的家庭网络。你可以使用公网静态 IP，或者使用以下动态 DNS (DDNS) 服务：
   - DuckDNS
   - [Amazon Route53](https://github.com/jc21/route53-ddns)
   - [Cloudflare](https://github.com/jc21/cloudflare-ddns)
4. 将 Nginx Proxy Manager 作为家庭网络统一网关，反代和分发流量到你内网的其他 Web 综合服务。

## 快速搭建

1. [安装 Docker](https://docs.docker.com/install/)
2. 创建一个 `docker-compose.yml` 配置文件，参考如下：

```yml
services:
  app:
    image: 'docker.io/mcn11415/nginx-proxy-manager:latest'
    restart: unless-stopped
    ports:
      - '80:80'
      - '81:81'
      - '443:443'
    volumes:
      - ./data:/data
      - ./letsencrypt:/etc/letsencrypt
```

这是启动项目所需的最低配置。可以查看 [官方文档](https://nginxproxymanager.com/setup/) 了解更多进阶参数。

3. 运行如下命令启动你的容器栈：

```bash
docker compose up -d
```

4. 登录到管理后台 UI

当你的 docker 容器启动完成后，可以在浏览器中访问 `81` 端口进入管理界面。
由于系统初次启动时需要生成加密密钥的熵，页面出来可能会稍等一小会。

后台入口：[http://127.0.0.1:81](http://127.0.0.1:81)


## 参与贡献

欢迎大家为这个项目提交 PR（Pull Requests），请将所有合并请求提交至 `develop` 分支。正式版发布版本将基于 `master` 分支推送。

本项目使用了 CI（持续集成）工具。所有的 PR 在考虑合并前都必须通过 CI 测试。测试通过后，针对该 PR 的 docker 镜像构建版会出现在 Docker Hub 上以便进行人工验证。

位于 `develop` 分支内的开发文档可以通过以下链接预览：
[https://develop.nginxproxymanager.com](https://develop.nginxproxymanager.com)


### 贡献者名单

特别感谢 [所有的代码贡献者](https://github.com/NginxProxyManager/nginx-proxy-manager/graphs/contributors) 为开源社区做出的支持。


## 获取支持

1. [发现了一个 Bug？](https://github.com/NginxProxyManager/nginx-proxy-manager/issues)
2. [参与讨论](https://github.com/NginxProxyManager/nginx-proxy-manager/discussions)
3. [Reddit 社区](https://reddit.com/r/nginxproxymanager)
