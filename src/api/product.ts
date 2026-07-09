import request from '@/utils/http'

export type ProductStatus = 1 | 2
export type ProductHot = 0 | 1

export interface ProductCategoryItem {
  id: number
  parent_id: number
  category_name: string
  category_code: string
  sort: number
  status: ProductStatus
  remark: string
  product_count: number
  created_at: number
  updated_at: number
  children?: ProductCategoryItem[]
}

export interface ProductItem {
  id: number
  category_id: number
  category_name: string
  category_code: string
  product_name: string
  product_code: string
  media_name: string
  ad_type: string
  unit: string
  list_price: string
  base_price: string
  sale_price: string
  inventory_total: number
  inventory_used: number
  inventory_available: number
  delivery_cycle_days: number
  status: ProductStatus
  is_hot: ProductHot
  cover_attachment_id: number
  specification: string
  remark: string
  created_at: number
  updated_at: number
}

export interface ProductCategoryOption {
  id: number
  parent_id: number
  category_name: string
  category_code: string
  children?: ProductCategoryOption[]
}

export interface ProductListParams {
  page?: number
  size?: number
  product_name?: string
  product_code?: string
  category_id?: number
  media_name?: string
  ad_type?: string
  status?: ProductStatus
  is_hot?: ProductHot
}

export interface ProductCategoryListParams {
  page?: number
  size?: number
  category_name?: string
  category_code?: string
  parent_id?: number
  status?: ProductStatus
}

export interface ProductFormParams {
  id?: number
  category_id: number
  product_name: string
  product_code?: string
  media_name?: string
  ad_type?: string
  unit?: string
  list_price?: number | string
  base_price?: number | string
  sale_price?: number | string
  inventory_total?: number
  delivery_cycle_days?: number
  status: ProductStatus
  is_hot: ProductHot
  cover_attachment_id?: number
  specification?: string
  remark?: string
}

export interface ProductCategoryFormParams {
  id?: number
  parent_id: number | ''
  category_name: string
  category_code?: string
  sort: number
  status: ProductStatus
  remark?: string
}

export function fetchProductList(params: ProductListParams) {
  return request.post<Api.Common.PaginatedResponse<ProductItem>>({
    url: '/product/index',
    params
  })
}

export function fetchProductOptions() {
  return request.post<{ categories: ProductCategoryOption[] }>({
    url: '/product/select-options'
  })
}

export function createProduct(params: ProductFormParams) {
  return request.post<ProductItem>({
    url: '/product/create',
    params,
    showSuccessMessage: true
  })
}

export function updateProduct(params: ProductFormParams & { id: number }) {
  return request.post<ProductItem>({
    url: '/product/update',
    params,
    showSuccessMessage: true
  })
}

export function deleteProduct(params: { id: number }) {
  return request.post({
    url: '/product/delete',
    params,
    showSuccessMessage: true
  })
}

export function fetchProductCategoryList(params: ProductCategoryListParams) {
  return request.post<Api.Common.PaginatedResponse<ProductCategoryItem>>({
    url: '/product-category/index',
    params
  })
}

export function fetchProductCategoryOptions() {
  return request.post<{ categories: ProductCategoryOption[]; tree: ProductCategoryOption[] }>({
    url: '/product-category/select-options'
  })
}

export function createProductCategory(params: ProductCategoryFormParams) {
  return request.post<ProductCategoryItem>({
    url: '/product-category/create',
    params,
    showSuccessMessage: true
  })
}

export function updateProductCategory(params: ProductCategoryFormParams & { id: number }) {
  return request.post<ProductCategoryItem>({
    url: '/product-category/update',
    params,
    showSuccessMessage: true
  })
}

export function deleteProductCategory(params: { id: number }) {
  return request.post({
    url: '/product-category/delete',
    params,
    showSuccessMessage: true
  })
}
