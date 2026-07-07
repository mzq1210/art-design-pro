<!-- 个人中心页面 -->
<template>
  <div class="w-full h-full p-0 bg-transparent border-none shadow-none">
    <div class="relative flex-b mt-2.5 max-md:block max-md:mt-1">
      <div class="w-112 mr-5 max-md:w-full max-md:mr-0">
        <div class="art-card-sm relative p-9 pb-6 overflow-hidden text-center">
          <img class="absolute top-0 left-0 w-full h-50 object-cover" src="@imgs/user/bg.webp" />
          <img
            class="relative z-10 w-20 h-20 mt-30 mx-auto object-cover border-2 border-white rounded-full"
            :src="avatarUrl"
            alt="avatar"
          />
          <h2 class="mt-5 text-xl font-normal">{{ profile.userName || '-' }}</h2>
          <p class="mt-5 text-sm">{{ profile.introduction || '' }}</p>

          <div class="w-75 mx-auto mt-7.5 text-left">
            <div class="mt-2.5">
              <ArtSvgIcon icon="ri:mail-line" class="text-g-700" />
              <span class="ml-2 text-sm">{{ profile.email || '' }}</span>
            </div>
            <div class="mt-2.5">
              <ArtSvgIcon icon="ri:phone-line" class="text-g-700" />
              <span class="ml-2 text-sm">{{ profile.mobile || '' }}</span>
            </div>
            <div class="mt-2.5">
              <ArtSvgIcon icon="ri:map-pin-line" class="text-g-700" />
              <span class="ml-2 text-sm">{{ profile.address || '' }}</span>
            </div>
            <div class="mt-2.5">
              <ArtSvgIcon icon="ri:user-3-line" class="text-g-700" />
              <span class="ml-2 text-sm">{{ roleText }}</span>
            </div>
          </div>

          <div class="mt-10">
            <h3 class="text-sm font-medium">标签</h3>
            <div class="flex flex-wrap justify-center mt-3.5">
              <div
                v-for="item in labelList"
                :key="item"
                class="py-1 px-1.5 mr-2.5 mb-2.5 text-xs border border-g-300 rounded"
              >
                {{ item }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="flex-1 overflow-hidden max-md:w-full max-md:mt-3.5">
        <div class="art-card-sm">
          <h1 class="p-4 text-xl font-normal border-b border-g-300">基本设置</h1>

          <ElForm
            ref="profileFormRef"
            :model="profileForm"
            :rules="profileRules"
            class="box-border p-5 [&>.el-row_.el-form-item]:w-[calc(50%-10px)] [&>.el-row_.el-input]:w-full [&>.el-row_.el-select]:w-full"
            label-width="86px"
            label-position="top"
          >
            <ElFormItem label="头像">
              <ElUpload
                class="avatar-uploader"
                :action="uploadAction"
                :headers="uploadHeaders"
                :data="{ scene: 'avatar' }"
                name="file"
                :disabled="!isEdit"
                :show-file-list="false"
                :before-upload="beforeAvatarUpload"
                :on-success="handleAvatarSuccess"
                :on-error="handleAvatarError"
              >
                <img
                  v-if="profileForm.avatar"
                  :src="profileForm.avatar"
                  class="avatar-preview"
                  alt="avatar"
                />
                <div v-else class="avatar-placeholder">上传</div>
              </ElUpload>
            </ElFormItem>

            <ElRow>
              <ElFormItem label="姓名" prop="userName">
                <ElInput v-model="profileForm.userName" :disabled="!isEdit" />
              </ElFormItem>
              <ElFormItem label="性别" class="ml-5">
                <ElSelect v-model="profileForm.gender" disabled placeholder="">
                  <ElOption label="男" value="1" />
                  <ElOption label="女" value="2" />
                </ElSelect>
              </ElFormItem>
            </ElRow>

            <ElRow>
              <ElFormItem label="昵称">
                <ElInput v-model="profileForm.nickName" disabled />
              </ElFormItem>
              <ElFormItem label="邮箱" prop="email" class="ml-5">
                <ElInput v-model="profileForm.email" :disabled="!isEdit" />
              </ElFormItem>
            </ElRow>

            <ElRow>
              <ElFormItem label="手机">
                <ElInput v-model="profileForm.mobile" disabled />
              </ElFormItem>
              <ElFormItem label="地址" class="ml-5">
                <ElInput v-model="profileForm.address" disabled />
              </ElFormItem>
            </ElRow>

            <ElFormItem label="个人介绍" class="h-32">
              <ElInput v-model="profileForm.introduction" type="textarea" :rows="4" disabled />
            </ElFormItem>

            <div class="flex-c justify-end [&_.el-button]:!w-27.5">
              <ElButton v-if="isEdit" class="w-22.5" @click="cancelEdit">取消</ElButton>
              <ElButton type="primary" class="w-22.5" :loading="savingProfile" @click="edit">
                {{ isEdit ? '保存' : '编辑' }}
              </ElButton>
            </div>
          </ElForm>
        </div>

        <div class="art-card-sm my-5">
          <h1 class="p-4 text-xl font-normal border-b border-g-300">更改密码</h1>

          <ElForm
            ref="passwordFormRef"
            :model="passwordForm"
            :rules="passwordRules"
            class="box-border p-5"
            label-width="86px"
            label-position="top"
          >
            <ElFormItem label="当前密码" prop="oldPassword">
              <ElInput
                v-model="passwordForm.oldPassword"
                type="password"
                :disabled="!isEditPwd"
                show-password
              />
            </ElFormItem>

            <ElFormItem label="新密码" prop="newPassword">
              <ElInput
                v-model="passwordForm.newPassword"
                type="password"
                :disabled="!isEditPwd"
                show-password
              />
            </ElFormItem>

            <ElFormItem label="确认新密码" prop="confirmPassword">
              <ElInput
                v-model="passwordForm.confirmPassword"
                type="password"
                :disabled="!isEditPwd"
                show-password
              />
            </ElFormItem>

            <div class="flex-c justify-end [&_.el-button]:!w-27.5">
              <ElButton v-if="isEditPwd" class="w-22.5" @click="cancelEditPwd">取消</ElButton>
              <ElButton type="primary" class="w-22.5" :loading="savingPassword" @click="editPwd">
                {{ isEditPwd ? '保存' : '编辑' }}
              </ElButton>
            </div>
          </ElForm>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ElMessage, type FormInstance, type FormRules, type UploadProps } from 'element-plus'
  import { storeToRefs } from 'pinia'
  import defaultAvatar from '@/assets/images/user/avatar.webp'
  import { changePassword, updateProfile } from '@/api/auth'
  import { useUserStore } from '@/store/modules/user'

  defineOptions({ name: 'UserCenter' })

  interface ProfileForm {
    userName: string
    nickName: string
    email: string
    avatar: string
    mobile: string
    address: string
    gender: string
    introduction: string
  }

  interface PasswordForm {
    oldPassword: string
    newPassword: string
    confirmPassword: string
  }

  interface UploadSuccessResponse {
    code: number
    message?: string
    data?: {
      url: string
    }
  }

  const userStore = useUserStore()
  const { getUserInfo: profile } = storeToRefs(userStore)

  const isEdit = ref(false)
  const isEditPwd = ref(false)
  const savingProfile = ref(false)
  const savingPassword = ref(false)
  const profileFormRef = ref<FormInstance>()
  const passwordFormRef = ref<FormInstance>()

  const uploadAction = computed(() => `${import.meta.env.VITE_API_URL}/common/upload`)
  const uploadHeaders = computed(() =>
    userStore.accessToken ? { Authorization: `Bearer ${userStore.accessToken}` } : {}
  )
  const avatarUrl = computed(() => profile.value.avatar || defaultAvatar)
  const roleText = computed(() => profile.value.roles?.join('、') || '')

  const labelList: Array<string> = ['专注设计', '很有想法', '高效开发', '后台系统']

  const profileForm = reactive<ProfileForm>({
    userName: '',
    nickName: '',
    email: '',
    avatar: '',
    mobile: '',
    address: '',
    gender: '',
    introduction: ''
  })

  const passwordForm = reactive<PasswordForm>({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const validateConfirmPassword = (
    _rule: unknown,
    value: string,
    callback: (error?: Error) => void
  ) => {
    if (value !== passwordForm.newPassword) {
      callback(new Error('两次输入的新密码不一致'))
      return
    }

    callback()
  }

  const profileRules: FormRules<ProfileForm> = {
    userName: [
      { required: true, message: '请输入姓名', trigger: 'blur' },
      { min: 2, max: 30, message: '长度在 2 到 30 个字符', trigger: 'blur' }
    ],
    email: [
      { required: true, message: '请输入邮箱', trigger: 'blur' },
      { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
    ]
  }

  const passwordRules: FormRules<PasswordForm> = {
    oldPassword: [{ required: true, message: '请输入当前密码', trigger: 'blur' }],
    newPassword: [
      { required: true, message: '请输入新密码', trigger: 'blur' },
      { min: 6, message: '密码至少 6 个字符', trigger: 'blur' }
    ],
    confirmPassword: [
      { required: true, message: '请确认新密码', trigger: 'blur' },
      { validator: validateConfirmPassword, trigger: 'blur' }
    ]
  }

  const fillProfileForm = () => {
    Object.assign(profileForm, {
      userName: profile.value.userName || '',
      nickName: profile.value.nickName || '',
      email: profile.value.email || '',
      avatar: profile.value.avatar || '',
      mobile: profile.value.mobile || '',
      address: profile.value.address || '',
      gender: profile.value.gender || '',
      introduction: profile.value.introduction || ''
    })
  }

  const resetPasswordForm = () => {
    passwordForm.oldPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
    passwordFormRef.value?.clearValidate()
  }

  const beforeAvatarUpload: UploadProps['beforeUpload'] = (rawFile) => {
    const isImage = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(rawFile.type)
    const isLt2M = rawFile.size / 1024 / 1024 < 2

    if (!isImage) {
      ElMessage.error('头像只能上传 jpg、png、gif、webp 图片')
      return false
    }

    if (!isLt2M) {
      ElMessage.error('头像大小不能超过 2MB')
      return false
    }

    return true
  }

  const handleAvatarSuccess: UploadProps['onSuccess'] = (response: UploadSuccessResponse) => {
    if (response.code !== 0 || !response.data?.url) {
      ElMessage.error(response.message || '头像上传失败')
      return
    }

    profileForm.avatar = response.data.url
  }

  const handleAvatarError: UploadProps['onError'] = () => {
    ElMessage.error('头像上传失败')
  }

  const edit = async () => {
    if (!isEdit.value) {
      isEdit.value = true
      return
    }

    await profileFormRef.value?.validate()

    try {
      savingProfile.value = true
      const data = await updateProfile({
        userName: profileForm.userName,
        email: profileForm.email,
        avatar: profileForm.avatar
      })
      userStore.setUserInfo(data)
      fillProfileForm()
      isEdit.value = false
    } finally {
      savingProfile.value = false
    }
  }

  const editPwd = async () => {
    if (!isEditPwd.value) {
      isEditPwd.value = true
      return
    }

    await passwordFormRef.value?.validate()

    try {
      savingPassword.value = true
      await changePassword({
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword
      })
      isEditPwd.value = false
      resetPasswordForm()
    } finally {
      savingPassword.value = false
    }
  }

  const cancelEdit = () => {
    fillProfileForm()
    isEdit.value = false
    profileFormRef.value?.clearValidate()
  }

  const cancelEditPwd = () => {
    isEditPwd.value = false
    resetPasswordForm()
  }

  watch(
    () => profile.value,
    () => fillProfileForm(),
    { immediate: true, deep: true }
  )
</script>

<style scoped lang="scss">
  .avatar-uploader {
    display: inline-flex;

    :deep(.el-upload) {
      width: 72px;
      height: 72px;
      overflow: hidden;
      cursor: pointer;
      border: 1px dashed var(--el-border-color);
      border-radius: 8px;
      transition: border-color 0.2s;

      &:hover {
        border-color: var(--el-color-primary);
      }

      &.is-disabled {
        cursor: not-allowed;
      }
    }
  }

  .avatar-preview {
    display: block;
    width: 72px;
    height: 72px;
    object-fit: cover;
  }

  .avatar-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 72px;
    height: 72px;
    font-size: 13px;
    color: var(--el-text-color-secondary);
  }
</style>
