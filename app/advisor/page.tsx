import Link from "next/link";
import { redirect } from "next/navigation";
import { AdvisorDashboard, type AdvisorInquiry } from "@/components/AdvisorDashboard";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function isAdvisorRole(role: unknown) {
  return role === "staff" || role === "reviewer" || role === "admin";
}

export default async function AdvisorPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/auth?country=kg&language=zh&returnTo=${encodeURIComponent("/advisor")}`);

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name,role,status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!isAdvisorRole(profile?.role) || profile?.status !== "active") {
    return (
      <main className="account-shell shell">
        <Link className="back-link" href="/kg/zh">← 返回商机页面</Link>
        <h1>顾问工作台</h1>
        <section className="advisor-card">
          <h2>没有访问权限</h2>
          <p>当前账号不是当地顾问或管理员账号。请先让管理员在 Supabase 的 profiles 表里把该账号 role 设置为 staff、reviewer 或 admin。</p>
        </section>
      </main>
    );
  }

  const { data: inquiries } = await supabase
    .from("inquiries")
    .select("id,intent_type,market_code,language,name,contact,channel,delivery_city,custom_product_name,quantity,message,source,status,created_at,products(legacy_id)")
    .order("created_at", { ascending: false })
    .limit(200);
  const normalizedInquiries = (inquiries ?? []).map((item) => ({
    ...item,
    products: Array.isArray(item.products) ? item.products[0] ?? null : item.products,
  }));

  return (
    <main className="advisor-shell shell">
      <div className="account-heading">
        <div>
          <Link className="back-link" href="/kg/zh">← 返回商机页面</Link>
          <h1>顾问工作台</h1>
          <p>处理采购意向和咨询申请。登录账号：{profile.display_name ?? user.email}</p>
        </div>
      </div>
      <AdvisorDashboard initialInquiries={normalizedInquiries as AdvisorInquiry[]} />
    </main>
  );
}
