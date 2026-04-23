# 租房好物推荐LAB (lv-house)

租房好物推荐LAB 是一个面向租房场景的微信小程序，用于沉淀博主推荐好物，并通过集合、场景、房间等维度帮助用户快速发现和转化。

## 当前已实现

- 首页浏览：小红书精选、按场景逛、按房间逛、全部好物列表
- 好物详情：多图轮播、价格、推荐指数、标签、浏览量、收藏量、相关推荐
- 搜索与聚合：关键词搜索、集合/场景/房间聚合列表
- 用户能力：微信登录、个人资料编辑、退出登录、我的收藏
- 收藏能力：详情页收藏/取消收藏、我的收藏列表、后端收藏计数同步
- 管理员能力：新增/编辑/删除好物，内联新增维度，首页长按编辑/删除集合/场景/房间
- 维度管理：集合/场景/房间支持名称、图标、封面图编辑；商品编辑页支持清晰的选中/删除维度关联
- 分享海报：商品详情页支持生成商品海报、预览、保存到相册
- 评论互动：一级评论、一层回复、作者可删自己的评论、管理员可删除评论
- 站内通知：我的页面通知中心，支持“有人回复我的评论”通知
- 自动化测试：Jest 单测、覆盖率阈值、pre-commit 自动测试

## 当前暂未实现或仅部分实现

- 前台价格筛选 UI：后端已支持价格区间查询，首页/搜索页暂未提供筛选面板
- 前台标签浏览入口：详情页和编辑页已支持标签，首页暂无独立标签入口
- 浏览/收藏统计面板：已记录 `viewCount` / `likeCount`，但暂无可视化统计页
- 评论管理增强：管理员“隐藏评论”、评论审核、评论点赞暂未实现
- 通知增强：目前仅支持站内回复通知，未接入微信订阅消息
- 非功能项仍有缺口：维度缓存 TTL、缩略图/原图分层、关键行为埋点尚未落地

## 技术栈

- 微信小程序原生开发
- 微信云开发（云函数 + 云数据库 + 云存储）
- Lovable Design System 风格适配
- Jest 自动化测试

## 核心页面

- `pages/goods/index/index`：首页
- `pages/goods/detail/detail`：商品详情、海报、评论
- `pages/goods/list/list`：维度聚合列表
- `pages/goods/collection/collection`：集合详情
- `pages/goods/edit/edit`：管理员商品编辑
- `pages/goods/search/search`：搜索页
- `pages/mine/index/index`：个人中心、收藏、通知入口
- `pages/notice/index/index`：通知中心
- `pages/login/index/index`：登录页

## 数据库集合

至少需要以下集合：

- `users`
- `goods`
- `collections`
- `scenes`
- `rooms`
- `tags`
- `favorites`
- `comments`
- `notifications`

建议权限：

- `users`、`favorites`、`comments`、`notifications`：仅创建者可读写
- `goods`、`collections`、`scenes`、`rooms`、`tags`：所有人可读，写操作统一走云函数做管理员校验

## 云函数部署

首次运行或修改云函数后，请在微信开发者工具中重新【上传并部署】相关云函数。当前主要云函数包括：

- 基础业务：`login`、`getGoods`、`getGoodsDetail`、`saveGoods`、`deleteGoods`
- 维度管理：`getCollections`、`getScenes`、`getRooms`、`getTags`、`addDimension`、`updateDimension`、`deleteDimension`
- 用户与收藏：`updateUserInfo`、`toggleFavorite`、`getFavorites`
- 海报 / 评论 / 通知：`getPosterCode`、`getComments`、`createComment`、`deleteComment`、`getNotifications`、`markNotificationRead`

## 开始使用

1. 克隆仓库
2. 微信开发者工具导入项目
3. 创建并绑定云开发环境
4. 初始化数据库集合：`users`、`goods`、`collections`、`scenes`、`rooms`、`tags`、`favorites`、`comments`、`notifications`
5. 上传并部署全部云函数
6. 编译运行

## 自动化测试

- 安装依赖：`npm install`
- 运行全部测试：`npm test`
- 监听模式：`npm run test:watch`
- 查看覆盖率：`npm run test:coverage`
- 统一校验命令：`npm run verify`

## 开发约定

- 每次修改后至少执行一次 `npm test`
- 提交前建议执行 `npm run verify`
- 如果修改了 `miniprogram/utils` 或 `cloudfunctions`，需要同步补充或更新对应测试
- 已启用 `.husky/pre-commit`，本地提交前会自动执行 `npm test`
