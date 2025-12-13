import { Container } from "@/components/web/container";

export default function ServicePage() {
  return (
    <Container>
      <div className="max-w-4xl mx-auto py-6">
        <h1 className="text-3xl font-bold mb-8">服务条款</h1>

        <div className="prose prose-sm space-y-6">
          <section className="space-y-3">
            <h2 className="text-xl font-semibold">1. 服务协议的范围</h2>
            <p>
              本协议是您与银行帮平台（以下简称"本站"）之间关于使用平台服务所订立的协议。银行帮是一个免费、公益性质的银行求职信息整合与经验分享平台，由天津聚链科技有限公司运营。使用本站服务即表示您同意本协议的全部条款。
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">2. 服务内容</h2>
            <p>银行帮平台提供以下服务：</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>银行及金融机构招聘信息汇总与展示</li>
              <li>求职经验、面经、笔试攻略分享</li>
              <li>银行内推信息发布与对接</li>
              <li>求职相关资讯与帮助中心</li>
              <li>用户个人主页与内容收藏管理</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">3. 用户责任</h2>
            <p>用户在使用银行帮平台服务时应当遵守以下规定：</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>遵守中华人民共和国相关法律法规</li>
              <li>不得发布虚假招聘信息或误导性内容</li>
              <li>不得上传违法、侵权或不实内容</li>
              <li>尊重其他用户的合法权益与隐私</li>
              <li>不得利用平台从事任何商业欺诈行为</li>
              <li>不得恶意攻击、干扰平台正常运行</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">4. 内容声明</h2>
            <p>
              本站内容主要由公开渠道汇总、用户分享及个人整理组成。我们会尽力核对信息的准确性与时效性，但不保证所有内容完全准确无误。本站内容仅供参考，不代表任何银行或金融机构的官方立场。求职者应以各机构官方发布的信息为准。
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">5. 知识产权</h2>
            <p>
              用户在平台上发布的原创内容（如面经、攻略等）仍归用户所有，但用户授予银行帮平台在站内展示、推广及必要编辑的权利。平台的Logo、界面设计、技术架构等知识产权归天津聚链科技有限公司所有。
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">6. 隐私保护</h2>
            <p>
              平台将严格保护用户的个人信息，未经用户同意不会向第三方披露。详细的隐私保护措施请参阅我们的《隐私政策》。
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">7. 服务变更和终止</h2>
            <p>
              平台保留随时修改、暂停或终止部分或全部服务的权利。对于重大变更，我们会通过站内公告或邮件等方式提前通知用户。用户可随时停止使用本站服务或申请注销账户。
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">8. 免责声明</h2>
            <p>对于以下情况，平台不承担责任：</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>因不可抗力（如自然灾害、政策变化等）造成的服务中断</li>
              <li>用户因依赖本站信息做出的求职决策及其后果</li>
              <li>第三方链接或用户发布内容的真实性与合法性</li>
              <li>因用户自身原因导致的账户安全问题</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">9. 违规处理</h2>
            <p>
              对于违反本协议的用户，平台有权采取警告、删除内容、限制功能、封禁账户等措施。情节严重的，平台保留追究法律责任的权利。
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">10. 协议修改</h2>
            <p>
              平台保留修改本协议的权利，修改后的协议将在本站公布。继续使用本站服务即视为同意修改后的协议。如有疑问，请联系我们：support@yinhangbang.com。
            </p>
            <p className="text-muted-foreground">最后更新日期：2025 年 12 月 12 日</p>
          </section>
        </div>
      </div>
    </Container>
  );
}