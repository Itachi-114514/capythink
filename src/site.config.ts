/**
 * 上线前只需要改这个文件，然后重新 `pnpm build`。
 * 留空的字段不会渲染，所以现在页脚和隐私页跟之前一样。
 */
export const SITE = {
  /** ICP 备案号，仅境内托管需要；Cloudflare 等境外托管留空。 */
  icp: '',
  /** 工信部备案查询地址，一般不用改 */
  icpUrl: 'https://beian.miit.gov.cn/',

  /** 公安备案号，例如「京公网安备 11010502000000号」。留空则不显示。 */
  police: '',
  policeUrl: 'https://beian.mps.gov.cn/',

  /** 对外联系邮箱，会出现在隐私页。留空则显示占位提示。 */
  contactEmail: '',
};


