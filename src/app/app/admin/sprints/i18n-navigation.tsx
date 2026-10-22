"use client";
import Link from "next/link";
import {useTranslation} from "@/i18n/client";
export function SprintReviewLink(){const t=useTranslation();return <Link href="/app/admin/sprints/review" className="btn btn-primary">{t("epic4Ui.review")}</Link>;}
export function SprintReviewHeader(){const t=useTranslation();return <header className="d-flex justify-content-between align-items-center"><h1 className="h3">{t("epic4Ui.review")}</h1><Link href="/app/admin/sprints" className="btn btn-outline-secondary">{t("epic4Ui.administration")}</Link></header>;}
