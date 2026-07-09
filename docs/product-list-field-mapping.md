# 产品列表字段映射

源文件：`docs/产品列表.xls`

清洗结果：`docs/product-list-mapped.csv`

## 已保留字段

| Excel 字段   | 数据库字段      | 表             |
| ------------ | --------------- | -------------- |
| 产品名称     | product_name    | crm_ad_product |
| 产品编号     | product_code    | crm_ad_product |
| 所属品牌     | media_name      | crm_ad_product |
| 产品单位     | unit            | crm_ad_product |
| 产品库存     | inventory_total | crm_ad_product |
| 销售价       | sale_price      | crm_ad_product |
| 成本价格     | base_price      | crm_ad_product |
| 市场价格     | list_price      | crm_ad_product |
| 产品描述     | remark          | crm_ad_product |
| 产品规格描述 | specification   | crm_ad_product |

## 未保留字段

产品别名、所属分类、计费周期、修改价格、关联供应商、授权部门、授权员工、起售数量、最低限价、规格名、规格值、价格、市场价、成本价、库存、体积、重量、条码。

## 处理规则

- 价格字段去掉千分位逗号，统一为两位小数。
- 库存字段统一为整数，空值按 `0` 处理。
- `所属分类` 不是当前产品表的直接字段，当前未写入 `category_id`。
- 原文件保留不改，后续导入时使用 `product-list-mapped.csv`。
