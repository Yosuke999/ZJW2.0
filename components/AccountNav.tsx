"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { intentTranslations } from "@/data/intent-translations";
import type { CountryCode, Language } from "@/data/types";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type AccountNavState = {
  signedIn: boolean;
  displayName: string;
};

function initials(name: string) {
  return name.trim().slice(0, 1).toUpperCase();
}

export function AccountNav({ country, language }: { country: CountryCode; language: Language }) {
  const copy = intentTranslations[language];
  const href = `/account?country=${country}&language=${language}`;
  const [state, setState] = useState<AccountNavState>({ signedIn: false, displayName: "" });

  useEffect(() => {
    let active = true;
    const supabase = createSupabaseBrowserClient();

    async function loadAccount() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!active) return;
      if (!user) {
        setState({ signedIn: false, displayName: "" });
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!active) return;
      setState({ signedIn: true, displayName: data?.display_name?.trim() ?? "" });
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
    <Link className={`account-link${state.signedIn ? " is-signed-in" : ""}`} href={href}>
      {state.signedIn && <span className="account-avatar" aria-hidden="true">{initials(label)}</span>}
      <span>{label}</span>
    </Link>
  );
}
