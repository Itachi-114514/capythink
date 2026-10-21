import Link from 'next/link';
import { SITE } from '@/site.config';

export default function PrivacyPage() {
  return (
    <div className="wrap page">
      <div className="prose narrow">
        <div className="kicker">隐私政策</div>
        <h1>我们收集什么</h1>
        <p className="muted small">最后更新：2026 年 10 月</p>

        <p>
          <strong>一句话：这个站点不收集可以联系到你的信息。</strong>
        </p>

        <h2>不收集什么</h2>
        <ul>
          <li>不需要注册，不收集邮箱、手机号、姓名。</li>
          <li>没有账号，也没有服务器端的个人档案。</li>
          <li>没有第三方统计、广告或追踪脚本。</li>
        </ul>

        <h2>答案存在哪里</h2>
        <p>
          30 条陈述的答案、六维分数、书单、历史记录、书架标签和一句话感想，都在你的浏览器里计算和保存，用的键名是
          <code> capythink.result.v1 </code>、<code> capythink.draft.v1 </code>、
          <code> capythink.history.v1 </code>和<code> capythink.shelf.v1 </code>
          （localStorage）。它们不会上传到服务器，我们看不到你选了哪一项，也看不到你的书架。
        </p>

        <h2>服务器会看到什么</h2>
        <p>
          托管服务为了维持运行，可能记录访问时间、IP 地址、浏览器类型这类常规日志，用于安全和故障排查。我们不会把它们和你的答题内容关联起来。
        </p>

        <h2>怎么删除</h2>
        <p>
          结果页有「清除这份结果」，「我的记录」页有「清除所有记录」；你也可以直接清除浏览器的站点数据。清除后无法恢复，也没有备份。
        </p>

        <h2>未成年人</h2>
        <p>
          这个版本不收集个人信息，也没有账号。如果你未满 18 岁，建议在监护人知情的情况下使用。
        </p>

        <h2>联系我们</h2>
        {SITE.contactEmail ? (
          <p>
            联系邮箱：
            <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a>
          </p>
        ) : (
          <p className="muted">
            这个站点不收集个人信息。如需联系，可以在发布它的视频账号下留言。
          </p>
        )}

        <p className="mt-4">
          <Link href="/">回到首页</Link>
        </p>
      </div>
    </div>
  );
}
