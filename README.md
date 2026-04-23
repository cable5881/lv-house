# 小吕孩的出租屋 (lv-house)

租房好物推荐微信小程序，与小红书自媒体联动运营。

## 功能特性

- 📕 **小红书集合**：按期展示博主推荐好物
- 🎯 **场景分组**：搬家必备、过年焕新、情人节等
- 🏠 **房间分类**：卧室、厨房、客厅、卫生间等
- ⭐ **推荐指数**：1-10分星星评分体系
- 🛒 **商品链接**：一键复制购买链接
- 👤 **角色管理**：普通用户 / 管理员
- ✏️ **管理员编辑**：在线新增/编辑/删除好物

## 技术栈

- 微信小程序原生开发
- 微信云开发（云函数 + 云数据库 + 云存储）
- Lovable Design System 设计规范

## 项目结构

```
lv-house/
├── cloudfunctions/     # 云函数
├── miniprogram/        # 小程序代码
│   ├── components/     # 公共组件
│   ├── pages/          # 页面
│   ├── utils/          # 工具函数
│   └── images/         # 图标资源
└── project.config.json
```

## 开始使用

1. 克隆仓库
2. 微信开发者工具导入项目
3. 创建云开发环境
4. 初始化数据库集合：users, goods, collections, scenes, rooms, tags
5. 部署全部云函数
6. 编译运行

## 自动化测试

- 安装依赖：`npm install`
- 运行全部测试：`npm test`
- 监听模式：`npm run test:watch`
- 查看覆盖率：`npm run test:coverage`
- 统一校验命令：`npm run verify`

### 后续开发约定

- 每次修改后至少执行一次 `npm test`
- 提交前建议执行 `npm run verify`
- 如果修改了 `miniprogram/utils` 或 `cloudfunctions`，需要同步补充或更新对应测试
- 已启用 `.husky/pre-commit`，本地提交前会自动执行 `npm test`
