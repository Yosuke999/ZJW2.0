"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { intentTranslations } from "@/data/intent-translations";
import { advisorTranslations } from "@/data/advisor-translations";
import type { CountryCode, Language } from "@/data/types";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type AccountNavState = {
  signedIn: boolean;
  displayName: string;
  advisor: boolean;
};

function isAdvisorRole(role: unknown) {
  return role === "staff" || role === "reviewer" || role === "admin";
}

export function AccountNav({ country, language }: { country: CountryCode; language: Language }) {
  const copy = intentTranslations[language];
  const href = `/account?country=${country}&language=${language}`;
  const [state, setState] = useState<AccountNavState>({ signedIn: false, displayName: "", advisor: false });

  useEffect(() => {
    let active = true;
    const supabase = createSupabaseBrowserClient();

    async function loadAccount() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!active) return;
      if (!user) {
        setState({ signedIn: false, displayName: "", advisor: false });
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("display_name,role,status")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!active) return;
      const metaName = typeof user.user_metadata?.display_name === "string"
        ? user.user_metadata.display_name
        : typeof user.user_metadata?.name === "string"
          ? user.user_metadata.name
          : "";
      setState({
        signedIn: true,
        displayName: data?.display_name?.trim() || metaName.trim(),
        advisor: isAdvisorRole(data?.role) && data?.status === "active",
      });
    }

    void loadAccount();
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      void loadAccount();
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const label = state.signedIn ? state.displayName || copy.account : copy.signIn;

  return (
    <>
      {state.advisor && <Link className="account-link workspace-link" href={`/advisor?language=${language}`}><span>{advisorTranslations[language].workspace}</span></Link>}
      <Link className={`account-link${state.signedIn ? " is-signed-in" : ""}`} href={href}>
        <span>{label}</span>
      </Link>
    </>
  );
}
