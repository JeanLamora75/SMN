"use client";

import Link from "next/link";
import {usePathname} from "next/navigation";
import {useTranslation} from "@/i18n/client";
import {privateNavigation,activePrivateEntry,type PrivateMode,type PrivateRole} from "@/lib/private-navigation";

export default function PrivateNavigation({mode,role,product,team,onNavigate}:{
  mode:PrivateMode|null;
  role:PrivateRole;
  product:string|null;
  team:string|null;
  onNavigate?:()=>void;
}) {
  const pathname=usePathname();
  const t=useTranslation();
  const groups=privateNavigation(mode,role);
  return <aside className="smn-sidebar" aria-label={t("navigation.ariaLabel")}>
    <nav className="smn-private-navigation" aria-label={t("navigation.ariaLabel")}>
      <div className="smn-nav-workspace">
        <div className="smn-nav-eyebrow">{t("navigation.context")}</div>
        <strong className="smn-nav-product">{product??t("navigation.contextUnavailable")}</strong>
        {team&&<div className="smn-nav-team">{team}</div>}
        <span className="smn-nav-mode">{t(mode==="scrum"?"navigation.modes.scrum":mode==="kanban"?"navigation.modes.kanban":"navigation.contextUnavailable")}</span>
      </div>
      {groups.map(group=><section key={group.id} className="smn-nav-group" aria-label={t(group.label)}>
        <h2 className="smn-nav-eyebrow">{t(group.label)}</h2>
        <ul className="smn-private-nav-list">
          {group.entries.map(entry=><li key={entry.id}>
            {entry.href?
              <Link href={entry.href} onClick={onNavigate} title={t(entry.label)}
                aria-label={t(entry.label)}
                className={"smn-nav-link"+(activePrivateEntry(pathname,entry)?" is-active":"")}
                aria-current={activePrivateEntry(pathname,entry)?"page":undefined}>
                <span className="smn-nav-icon" aria-hidden="true">{entry.icon}</span>
                <span className="smn-nav-label">{t(entry.label)}</span>
              </Link>
            :<span className="smn-nav-link smn-nav-disabled" aria-disabled="true"
                aria-label={t(entry.label)} title={t("navigation.unavailable")}>
                <span className="smn-nav-icon" aria-hidden="true">{entry.icon}</span>
                <span className="smn-nav-label">{t(entry.label)}</span>
                <span className="smn-nav-soon">{t("navigation.soon")}</span>
              </span>}
          </li>)}
        </ul>
      </section>)}
    </nav>
  </aside>;
}
