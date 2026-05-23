#!/usr/bin/env python3
"""Generate HTML slides for FedBank Togo presentation deck."""

import json
from pathlib import Path

DECK = "FedBank Togo — BDD Fédérées"
TOTAL = 25
OUT = Path(__file__).parent

BASE_CSS = """
        body { margin: 0; }
        .slide-container {
            width: 1280px; height: 720px;
            background: #F7F8FC;
            font-family: 'Inter', sans-serif;
            color: #1F2937;
            position: relative; overflow: hidden;
            display: flex; flex-direction: column;
        }
        .header-bar {
            background: #1A2E52; height: 90px;
            padding: 0 60px;
            display: flex; flex-direction: column; justify-content: center;
            position: relative; flex-shrink: 0;
        }
        .header-bar .overline {
            color: #B8860B; font-size: 11px; font-weight: 700;
            text-transform: uppercase; letter-spacing: 3px; margin-bottom: 4px;
        }
        .header-bar h2 {
            color: #FFFFFF; font-family: 'Space Grotesk', sans-serif;
            font-size: 26px; font-weight: 700; margin: 0;
        }
        .header-bar .slide-num {
            position: absolute; right: 60px; top: 50%;
            transform: translateY(-50%);
            color: #FFFFFF; font-family: 'Space Grotesk', sans-serif;
            font-size: 24px; font-weight: 700;
        }
        .slide-content {
            flex: 1; padding: 28px 56px;
            overflow: hidden; position: relative;
        }
        .slide-content h3 {
            font-family: 'Space Grotesk', sans-serif;
            font-size: 18px; color: #1A2E52; margin: 0 0 12px 0;
        }
        .slide-content p, .slide-content li {
            font-size: 15px; line-height: 1.45; color: #1F2937; margin-bottom: 8px;
        }
        .slide-content ul { margin: 0 0 8px 20px; padding: 0; }
        .slide-content ul li::marker { color: #C0392B; }
        .slide-content strong { color: #1A2E52; }
        .two-col { display: flex; gap: 32px; }
        .two-col .col-left { flex: 1.2; }
        .two-col .col-right { flex: 1; }
        pre {
            background: #1e1e2e; border-radius: 8px; padding: 12px 14px;
            font-size: 12px; line-height: 1.4; margin: 8px 0;
            color: #abb2bf; font-family: Consolas, monospace;
            white-space: pre-wrap;
        }
        code.inline {
            background: #eef1f8; color: #C0392B;
            padding: 1px 5px; border-radius: 4px; font-size: 0.88em;
            font-family: Consolas, monospace;
        }
        .encadre {
            background: #EEF1F8; border: 1px solid #D1D9E6;
            border-left: 5px solid #C0392B; padding: 10px 14px;
            border-radius: 0 8px 8px 0; margin: 10px 0;
        }
        .encadre p { font-family: Georgia, serif; font-style: italic;
            color: #1F2937; margin: 0; font-size: 14px; }
        table.data {
            width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 8px;
        }
        table.data th {
            background: #1A2E52; color: #fff; padding: 8px 10px; text-align: left;
        }
        table.data td {
            padding: 6px 10px; border-bottom: 1px solid #D1D9E6;
        }
        table.data tr:nth-child(even) td { background: #EEF1F8; }
        .plan-list { list-style: none; margin: 0; padding: 0; columns: 2; column-gap: 40px; }
        .plan-list li {
            padding: 6px 0 6px 36px; position: relative; font-size: 15px;
            break-inside: avoid;
        }
        .plan-list li::before {
            content: attr(data-n); position: absolute; left: 0;
            width: 26px; height: 26px; background: #1A2E52; color: #fff;
            border-radius: 50%; font-size: 12px; font-weight: 700;
            display: flex; align-items: center; justify-content: center;
            top: 4px;
        }
        .metrics { display: flex; gap: 16px; flex-wrap: wrap; margin-top: 12px; }
        .metric-box {
            flex: 1; min-width: 120px; background: #EEF1F8;
            border: 1px solid #D1D9E6; border-radius: 8px;
            padding: 14px; text-align: center;
        }
        .metric-box .val { font-size: 28px; font-weight: 700; color: #1A2E52; }
        .metric-box .lbl { font-size: 11px; color: #6B7280; text-transform: uppercase; }
        .slide-footer {
            height: 36px; background: #f0f2f8; border-top: 1px solid #D1D9E6;
            display: flex; align-items: center; justify-content: space-between;
            padding: 0 60px; font-size: 12px; color: #6B7280; font-style: italic;
            flex-shrink: 0;
        }
        /* Title slide */
        .slide-title {
            width: 1280px; height: 720px;
            background: linear-gradient(135deg, #1A1A3A 0%, #2A2A5A 50%, #1A1A3A 100%);
            font-family: 'Inter', sans-serif; color: #FFFFFF;
            display: flex; flex-direction: column; justify-content: center; align-items: center;
            position: relative; overflow: hidden;
        }
        .slide-title::before, .slide-title::after {
            content: ''; position: absolute; left: 0; right: 0; height: 6px;
        }
        .slide-title::before { top: 0; background: #B8860B; }
        .slide-title::after { bottom: 0; background: #E53E3E; }
        .slide-title .content-box {
            background: rgba(255,255,255,0.97); padding: 48px 64px;
            border-radius: 16px; max-width: 880px; text-align: center;
            box-shadow: 0 24px 60px rgba(0,0,0,0.4); z-index: 2;
        }
        .slide-title .overline {
            color: #B8860B; font-size: 13px; font-weight: 700;
            text-transform: uppercase; letter-spacing: 4px; margin-bottom: 12px;
        }
        .slide-title h1 {
            font-family: 'Space Grotesk', sans-serif; font-size: 36px;
            color: #1A1A3A; margin: 0 0 8px; font-weight: 700;
        }
        .slide-title .sep { width: 80px; height: 4px; background: #E53E3E; margin: 16px auto; }
        .slide-title .subtitle { font-size: 17px; color: #4A5568; margin-bottom: 6px; }
        .slide-title .meta { font-size: 14px; color: #718096; font-style: italic; }
        .slide-title .footer-bar {
            position: absolute; bottom: 20px; left: 60px; right: 60px;
            display: flex; justify-content: space-between;
            font-size: 12px; color: rgba(255,255,255,0.5); z-index: 2;
        }
        /* Conclusion slide */
        .slide-conclusion {
            width: 1280px; height: 720px;
            background: #1A2E52;
            font-family: 'Inter', sans-serif;
            display: flex; flex-direction: column;
            padding: 48px 60px; box-sizing: border-box;
        }
        .slide-conclusion h2 {
            color: #fff; font-family: 'Space Grotesk', sans-serif;
            font-size: 28px; margin: 0 0 24px;
        }
        .slide-conclusion .cards { display: flex; gap: 16px; flex-wrap: wrap; flex: 1; }
        .slide-conclusion .card {
            flex: 1; min-width: 200px; background: rgba(255,255,255,0.08);
            border: 1px solid rgba(255,255,255,0.15); border-radius: 12px;
            padding: 20px; color: #E2E8F0; font-size: 14px; line-height: 1.5;
        }
        .slide-conclusion .card strong { color: #B8860B; display: block; margin-bottom: 8px; }
        .slide-conclusion .quote {
            margin-top: 20px; padding: 16px 20px;
            border-left: 4px solid #B8860B;
            color: rgba(255,255,255,0.9); font-style: italic; font-size: 15px;
        }
        .slide-conclusion .foot {
            color: rgba(255,255,255,0.5); font-size: 12px;
            display: flex; justify-content: space-between; margin-top: 16px;
        }
"""

TITLE_SLIDE = """<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
    <style>{css}</style>
</head>
<body>
    <div class="slide-title">
        <div class="content-box">
            <div class="overline">Présentation produit</div>
            <h1>FedBank Togo</h1>
            <div class="sep"></div>
            <div class="subtitle">Système de Bases de Données Fédérées</div>
            <div class="subtitle">Une seule vue sur clients, crédits et comptabilité</div>
            <div class="meta">Banque Commerciale du Togo · Master SIBD · Mai 2026</div>
        </div>
        <div class="footer-bar"><span>{deck}</span><span>1 / {total}</span></div>
    </div>
</body>
</html>"""

CONCLUSION_SLIDE = """<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
    <style>{css}</style>
</head>
<body>
    <div class="slide-conclusion">
        <h2>Conclusion — FedBank Togo</h2>
        <div class="cards">
            <div class="card"><strong>✓ Unification</strong>3 SGBD hétérogènes fédérés sans migration destructive</div>
            <div class="card"><strong>✓ Produit livré</strong>API REST, UI React, monitoring, Docker — 10 conteneurs</div>
            <div class="card"><strong>✓ Résilience</strong>15 erreurs techniques documentées et résolues</div>
            <div class="card"><strong>✓ Conformité</strong>OHADA, BCEAO/UEMOA, ICF SHA-256</div>
        </div>
        <div class="quote">La fédération par FDW est une stratégie produit pour les organisations dont le patrimoine données est hétérogène.</div>
        <div class="foot"><span>{deck}</span><span>25 / {total} · Merci — Questions ?</span></div>
    </div>
</body>
</html>"""

CONTENT_SLIDE = """<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
    <style>{css}</style>
</head>
<body>
    <div class="slide-container">
        <div class="header-bar">
            <div class="overline">{overline}</div>
            <h2>{title}</h2>
            <div class="slide-num">{num}</div>
        </div>
        <div class="slide-content">{body}</div>
        <div class="slide-footer">
            <span>{deck}</span>
            <span>{num} / {total}</span>
        </div>
    </div>
</body>
</html>"""


def slide(num: int, filename: str, overline: str, title: str, body: str) -> tuple[str, str]:
    html = CONTENT_SLIDE.format(
        css=BASE_CSS, overline=overline, title=title, body=body,
        num=num, total=TOTAL, deck=DECK,
    )
    return filename, html


SLIDES = [
    # 1 title — handled separately
    (2, "slide_02_plan.html", "Sommaire", "Plan de la présentation", """
        <ul class="plan-list">
            <li data-n="1">L'entreprise et son contexte</li>
            <li data-n="2">Le problème métier</li>
            <li data-n="3">Le pourquoi — enjeux</li>
            <li data-n="4">Le comment — approche</li>
            <li data-n="5">La solution retenue</li>
            <li data-n="6">Proposition de valeur</li>
            <li data-n="7">Architecture</li>
            <li data-n="8">Fonctionnalités produit</li>
            <li data-n="9">Parcours utilisateur</li>
            <li data-n="10">Déploiement & monitoring</li>
            <li data-n="11">Erreurs & solutions</li>
            <li data-n="12">Résultats & métriques</li>
            <li data-n="13">Sécurité & tests</li>
            <li data-n="14">Perspectives</li>
            <li data-n="15">Conclusion</li>
        </ul>
    """),
    (3, "slide_03_entreprise.html", "Contexte", "L'entreprise — Banque du Togo", """
        <div class="two-col">
            <div class="col-left">
                <p><strong>Banque commerciale</strong> opérant au Togo — 5 agences (Lomé, Kpalimé, Sokodé, Kara, Dapaong).</p>
                <ul>
                    <li>20 clients · 30 comptes · 15 dossiers crédit</li>
                    <li>Comptabilité <strong>OHADA</strong> · Normes <strong>BCEAO/UEMOA</strong></li>
                </ul>
            </div>
            <div class="col-right">
                <table class="data">
                    <tr><th>Système</th><th>SGBD</th><th>Domaine</th></tr>
                    <tr><td>Core Banking</td><td>PostgreSQL</td><td>Clients, comptes</td></tr>
                    <tr><td>Crédits</td><td>MySQL</td><td>Scoring, garanties</td></tr>
                    <tr><td>Compta/RH</td><td>SQL Server</td><td>OHADA, paie</td></tr>
                </table>
                <div class="encadre"><p>Trois mondes séparés — aucune vision transverse.</p></div>
            </div>
        </div>
    """),
    (4, "slide_04_probleme.html", "Problème", "Le problème métier", """
        <table class="data">
            <tr><th>Problème</th><th>Impact</th></tr>
            <tr><td>Données <strong>cloisonnées</strong> (3 SGBD)</td><td>Pas de croisement crédit + compta + solde</td></tr>
            <tr><td>Pas de <strong>vue 360° client</strong></td><td>Score risque invisible à l'ouverture compte</td></tr>
            <tr><td><strong>Réconciliation manuelle</strong> ICF</td><td>Doublons, incohérences</td></tr>
            <tr><td>Reporting <strong>fragmenté</strong></td><td>3 exports Excel à consolider</td></tr>
            <tr><td>Décisions crédit <strong>lentes</strong></td><td>3 applications, données non synchronisées</td></tr>
        </table>
        <div class="encadre"><p>« Pour approuver un crédit, j'ouvre trois applications. » — Responsable crédit, Lomé</p></div>
    """),
    (5, "slide_05_pourquoi.html", "Pourquoi", "Le pourquoi (Why)", """
        <div class="two-col">
            <div class="col-left">
                <h3>Pourquoi fédérer ?</h3>
                <ul>
                    <li><strong>Héritage</strong> : migration totale = risque prohibitif</li>
                    <li><strong>Continuité</strong> : chaque SGBD reste source de vérité</li>
                    <li><strong>Conformité</strong> : OHADA + BCEAO préservés</li>
                    <li><strong>Décision</strong> : vue client + KPIs temps réel</li>
                </ul>
            </div>
            <div class="col-right">
                <h3>Objectifs mesurables</h3>
                <ol style="margin-left:20px;font-size:15px;line-height:1.6">
                    <li>Une <strong>API REST</strong> unique</li>
                    <li><strong>Vues fédérées SQL</strong> sur 3 sources</li>
                    <li><strong>Interface web</strong> en français</li>
                    <li><strong>Observabilité</strong> FDW + bases</li>
                    <li><strong>ICF</strong> comme clé de réconciliation</li>
                </ol>
            </div>
        </div>
    """),
    (6, "slide_06_comment.html", "Méthode", "Le comment (How)", """
        <pre>MODÉLISER  →  FÉDÉRER  →  EXPOSER  →  LIVRER
 MCD/MLD      FDW+Vues     API+UI      Docker+Monitoring</pre>
        <table class="data">
            <tr><th>Phase</th><th>Livrable</th><th>Technologie</th></tr>
            <tr><td>Modéliser</td><td>Schémas + ICF commun</td><td>SQL, MCD/MLD</td></tr>
            <tr><td>Fédérer</td><td>8 foreign tables, 6 vues</td><td>mysql_fdw, tds_fdw</td></tr>
            <tr><td>Exposer</td><td>9 routeurs, 17 pages</td><td>FastAPI, React 18</td></tr>
            <tr><td>Livrer</td><td>10 conteneurs</td><td>Docker Compose</td></tr>
        </table>
        <p><strong>Principe :</strong> PostgreSQL = hub unique — les autres bases restent dans leur domaine.</p>
    """),
    (7, "slide_07_alternatives.html", "Décision", "Alternatives & solution retenue", """
        <table class="data">
            <tr><th>Approche</th><th>Décision</th><th>Raison</th></tr>
            <tr><td>Migration vers 1 SGBD</td><td>❌</td><td>Coût, downtime</td></tr>
            <tr><td>ETL batch nightly</td><td>❌</td><td>Pas temps réel</td></tr>
            <tr><td>API Gateway seul</td><td>❌</td><td>Pas de jointures SQL</td></tr>
            <tr><td><strong>FDW PostgreSQL</strong></td><td>✅ Retenue</td><td>Jointures natives, temps réel</td></tr>
            <tr><td>Linked Server MSSQL</td><td>❌</td><td>Hub non centralisé</td></tr>
        </table>
    """),
    (8, "slide_08_solution.html", "Solution", "FedBank Togo — La solution", """
        <pre>React (3000) → FastAPI (8000) → PostgreSQL Hub (5435)
                                        ├→ MySQL Crédits (3308)
                                        └→ SQL Server Compta (1435)
                    Prometheus + Grafana (observabilité)</pre>
        <ul>
            <li><strong>Hub PostgreSQL 16</strong> : données locales + foreign tables + vues</li>
            <li><strong>FastAPI async</strong> : asyncpg, aiomysql, Pydantic v2</li>
            <li><strong>React 18</strong> : 17 pages, français, XOF</li>
            <li><strong>Docker Compose</strong> : <code class="inline">docker compose up -d --build</code></li>
        </ul>
    """),
    (9, "slide_09_valeur.html", "Valeur", "Proposition de valeur", """
        <table class="data">
            <tr><th>Rôle</th><th>Bénéfice</th></tr>
            <tr><td>Directeur d'agence</td><td>KPIs par agence, refresh vues matérialisées</td></tr>
            <tr><td>Responsable crédit</td><td>Vue 360° client, cycle demande → échéancier</td></tr>
            <tr><td>Contrôleur de gestion</td><td>Opérations + écritures OHADA, réconciliation ICF</td></tr>
            <tr><td>IT / DBA</td><td>Statut FDW, monitoring, requêtes SELECT sécurisées</td></tr>
        </table>
    """),
    (10, "slide_10_architecture.html", "Architecture", "Vue d'ensemble — 10 conteneurs", """
        <table class="data">
            <tr><th>Couche</th><th>Service</th><th>Port</th></tr>
            <tr><td>UI</td><td>react-frontend</td><td>3000</td></tr>
            <tr><td>API</td><td>fastapi-backend</td><td>8000</td></tr>
            <tr><td>Hub</td><td>postgres-hub + FDW</td><td>5435</td></tr>
            <tr><td>Crédits</td><td>mysql-credit</td><td>3308</td></tr>
            <tr><td>Compta</td><td>mssql-compta</td><td>1435</td></tr>
            <tr><td>Monitoring</td><td>prometheus, grafana, exporters</td><td>9090, 3001</td></tr>
        </table>
        <p><strong>Flux :</strong> React → FastAPI → PostgreSQL → vues FDW → MySQL / SQL Server</p>
        <p><strong>Critique :</strong> FDW initialisé après MySQL/MSSQL via <code class="inline">post-init.sh</code></p>
    """),
    (11, "slide_11_donnees.html", "Données", "Architecture — Couche données", """
        <div class="two-col">
            <div class="col-left">
                <h3>PostgreSQL local</h3>
                <p>agence (5) · employe (10) · client (20) · compte (30) · transaction (104)</p>
                <h3>ICF</h3>
                <pre>SHA-256(numero_piece + "TOGO_BK001") → 64 hex</pre>
            </div>
            <div class="col-right">
                <h3>Vues fédérées</h3>
                <ul style="font-size:14px">
                    <li>vue_client_complet (PG+MySQL)</li>
                    <li>vue_credit_detail (PG+MySQL)</li>
                    <li>vue_operation_comptable (PG+MSSQL)</li>
                    <li>vue_tableau_bord (3 sources)</li>
                    <li>mv_tableau_bord · mv_clients_risque_eleve</li>
                </ul>
            </div>
        </div>
    """),
    (12, "slide_12_application.html", "Application", "Backend & Frontend", """
        <div class="two-col">
            <div class="col-left">
                <h3>FastAPI — 9 routeurs</h3>
                <p style="font-size:13px">clients · comptes · crédits · opérations · dashboard · alertes · réconciliation · fédération · employés · database</p>
                <p>Async : asyncpg + aiomysql · Pas de <code class="inline">pool_pre_ping</code></p>
            </div>
            <div class="col-right">
                <h3>React — 17 pages</h3>
                <p style="font-size:13px">Dashboard, Clients, Comptes, Crédits, Échéanciers, Opérations, Employés, Alertes, Réconciliation, Fédération, BDD, Monitoring + 3 formulaires</p>
                <p>Vite 5 · Tailwind 4 · Recharts · 100 % français</p>
            </div>
        </div>
    """),
    (13, "slide_13_fonctionnalites.html", "Produit", "Fonctionnalités clés", """
        <table class="data">
            <tr><th>Module</th><th>Fonctionnalité</th></tr>
            <tr><td>Dashboard</td><td>KPIs, graphiques, refresh MV</td></tr>
            <tr><td>Clients</td><td>Fiche 360°, ICF auto, filtres</td></tr>
            <tr><td>Crédits</td><td>Cycle complet + scoring + garanties</td></tr>
            <tr><td>Alertes</td><td>Soldes bas, retard, transactions suspectes</td></tr>
            <tr><td>Réconciliation</td><td>ICF, doublons, comptes-crédits</td></tr>
            <tr><td>Export</td><td>CSV sur toutes les listes</td></tr>
        </table>
    """),
    (14, "slide_14_parcours.html", "Usage", "Parcours utilisateur — Crédit", """
        <pre>Dashboard agence → Recherche ICF → vue_client_complet
    → Création dossier → Garanties + scoring → Décision
    → Échéancier → Alertes si retard</pre>
        <p><strong>Contrôle comptable :</strong> Transaction PG → vue_operation_comptable → Écriture OHADA (MSSQL)</p>
        <div class="encadre"><p>Démo live : http://localhost:3000 · API : http://localhost:8000/docs</p></div>
    """),
    (15, "slide_15_deploiement.html", "Ops", "Déploiement & observabilité", """
        <pre>docker compose up -d --build</pre>
        <div class="two-col">
            <div class="col-left">
                <h3>URLs</h3>
                <ul style="font-size:14px">
                    <li>:3000 Frontend · :8000/docs API</li>
                    <li>:3001 Grafana · :9090 Prometheus</li>
                </ul>
            </div>
            <div class="col-right">
                <h3>Métriques custom</h3>
                <ul style="font-size:14px">
                    <li>db_connections_active</li>
                    <li>db_query_duration</li>
                    <li>fdw_connection_status</li>
                </ul>
            </div>
        </div>
    """),
    (16, "slide_16_erreurs_synthese.html", "Retour d'expérience", "15 erreurs — Synthèse", """
        <div class="metrics">
            <div class="metric-box"><div class="val">15</div><div class="lbl">Total</div></div>
            <div class="metric-box"><div class="val">15</div><div class="lbl">Résolues</div></div>
            <div class="metric-box"><div class="val">0</div><div class="lbl">Bloquantes</div></div>
            <div class="metric-box"><div class="val">3</div><div class="lbl">Critiques</div></div>
        </div>
        <table class="data" style="margin-top:16px">
            <tr><th>Catégorie</th><th>Nb</th><th>Exemples</th></tr>
            <tr><td>Docker</td><td>3</td><td>chmod, ports, DNS</td></tr>
            <tr><td>FDW</td><td>3</td><td>dbname, init, dates tds_fdw</td></tr>
            <tr><td>Backend/Front</td><td>3</td><td>pool_pre_ping, pytest, /api</td></tr>
            <tr><td>Seed/Données</td><td>5</td><td>ICF, trigger, TRUNCATE</td></tr>
        </table>
        <p style="font-size:13px">Source : <code class="inline">RAPPORT_ERREURS.md</code></p>
    """),
    (17, "slide_17_erreurs_docker.html", "Erreurs", "Docker & Infrastructure", """
        <ul style="font-size:14px;line-height:1.5">
            <li><strong>ERR-001</strong> chmod entrypoint — <code class="inline">USER mssql</code> après COPY/chmod</li>
            <li><strong>ERR-003</strong> Ports occupés — mapping 5435, 3308, 1435</li>
            <li><strong>ERR-005</strong> DNS conteneurs — <code class="inline">compose down && up</code></li>
            <li><strong>ERR-008</strong> Seed non auto — scripts intégrés dans images Docker</li>
        </ul>
    """),
    (18, "slide_18_erreurs_fdw.html", "Erreurs", "FDW & Fédération", """
        <ul style="font-size:14px;line-height:1.5">
            <li><strong>ERR-004</strong> <code class="inline">dbname</code> mysql_fdw — au niveau FOREIGN TABLE, pas SERVER</li>
            <li><strong>ERR-009</strong> FDW perdus au restart — <code class="inline">post-init.sh</code> + wrapper entrypoint</li>
            <li><strong>ERR-014</strong> Dates tds_fdw <code class="inline">Jan 10 2024 12:00:00:AM</code>
                <br>→ VARCHAR(30) + <code class="inline">TO_DATE(..., 'Mon DD YYYY HH12:MI:SS:AM')</code></li>
        </ul>
        <div class="encadre"><p>ERR-014 : erreur la plus impactante — page Opérations inaccessible avant correction.</p></div>
    """),
    (19, "slide_19_erreurs_app.html", "Erreurs", "Backend, Frontend & Données", """
        <table class="data">
            <tr><th>ID</th><th>Problème</th><th>Solution</th></tr>
            <tr><td>ERR-010</td><td>pool_pre_ping async</td><td>Retiré · SELECT 1</td></tr>
            <tr><td>ERR-011</td><td>pytest async</td><td>asyncio_mode=auto</td></tr>
            <tr><td>ERR-013</td><td>404 API</td><td>VITE_API_URL + /api</td></tr>
            <tr><td>ERR-002</td><td>Trigger avant table</td><td>Ordre SQL corrigé</td></tr>
            <tr><td>ERR-012</td><td>0 transactions</td><td>TRUNCATE RESTART IDENTITY</td></tr>
        </table>
    """),
    (20, "slide_20_lecons.html", "Leçons", "Leçons apprises", """
        <div class="two-col">
            <div class="col-left">
                <ul style="font-size:14px">
                    <li><strong>Docker :</strong> USER non-root après chmod</li>
                    <li><strong>FDW :</strong> init différée, dates en VARCHAR</li>
                    <li><strong>API :</strong> pas de pool_pre_ping async</li>
                </ul>
            </div>
            <div class="col-right">
                <ul style="font-size:14px">
                    <li><strong>Seed :</strong> idempotent TRUNCATE CASCADE</li>
                    <li><strong>ICF :</strong> exactement 64 caractères</li>
                    <li><strong>Doc :</strong> AGENTS.md + RAPPORT_ERREURS.md</li>
                </ul>
            </div>
        </div>
    """),
    (21, "slide_21_resultats.html", "Résultats", "Métriques du projet", """
        <div class="metrics">
            <div class="metric-box"><div class="val">3</div><div class="lbl">SGBD</div></div>
            <div class="metric-box"><div class="val">8</div><div class="lbl">Foreign tables</div></div>
            <div class="metric-box"><div class="val">20+</div><div class="lbl">Endpoints</div></div>
            <div class="metric-box"><div class="val">16</div><div class="lbl">Pages UI</div></div>
            <div class="metric-box"><div class="val">30</div><div class="lbl">Tests</div></div>
            <div class="metric-box"><div class="val">11</div><div class="lbl">Conteneurs</div></div>
        </div>
        <p style="margin-top:16px"><code class="inline">docker exec fastapi-backend pytest -v</code> · <code class="inline">./scripts/verify-all.sh</code></p>
    """),
    (22, "slide_22_securite.html", "Conformité", "Sécurité & conformité", """
        <table class="data">
            <tr><th>Mesure</th><th>Détail</th></tr>
            <tr><td>ICF SHA-256</td><td>Pas de pièce d'identité en clair</td></tr>
            <tr><td>Read-only</td><td>/api/database/query bloque DML</td></tr>
            <tr><td>Réseau</td><td>reseau-banque · .env non versionné</td></tr>
            <tr><td>OHADA / BCEAO</td><td>Plan comptable · XOF</td></tr>
        </table>
    """),
    (23, "slide_23_tests.html", "Qualité", "Tests & validation", """
        <ul>
            <li><strong>pytest</strong> + pytest-asyncio — 13 tests backend</li>
            <li><strong>Réconciliation</strong> — cohérence ICF, doublons</li>
            <li><strong>verify-all.sh</strong> — validation système complète</li>
            <li>Perspective : tests E2E frontend (Cypress/Playwright)</li>
        </ul>
    """),
    (24, "slide_24_perspectives.html", "Roadmap", "Perspectives", """
        <table class="data">
            <tr><th>Horizon</th><th>Évolution</th></tr>
            <tr><td>Court terme</td><td>JWT + RBAC</td></tr>
            <tr><td>Moyen terme</td><td>CI/CD · tests E2E</td></tr>
            <tr><td>Long terme</td><td>HA PostgreSQL Hub · mobile</td></tr>
        </table>
        <p>Cache Redis · pagination FDW · audit trail inter-bases</p>
    """),
]


def main():
    files = []

    # Slide 1 — title
    f1 = OUT / "slide_01_titre.html"
    f1.write_text(TITLE_SLIDE.format(css=BASE_CSS, deck=DECK, total=TOTAL), encoding="utf-8")
    files.append("slide_01_titre.html")

    for num, filename, overline, title, body in SLIDES:
        _, html = slide(num, filename, overline, title, body)
        (OUT / filename).write_text(html, encoding="utf-8")
        files.append(filename)

    # Slide 25 — conclusion
    f25 = OUT / "slide_25_conclusion.html"
    f25.write_text(CONCLUSION_SLIDE.format(css=BASE_CSS, deck=DECK, total=TOTAL), encoding="utf-8")
    files.append("slide_25_conclusion.html")

    slides_json = OUT / "slides.json"
    slides_json.write_text(json.dumps({"slides": files}, indent=2), encoding="utf-8")
    print(f"Generated {len(files)} slides in {OUT}")


if __name__ == "__main__":
    main()
