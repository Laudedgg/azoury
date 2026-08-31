This folder holds brand imagery used across the site. Drop the PNGs
here with these exact filenames so the components can find them:

    hero-produce-command-center.png    (~1663x955, warehouse scene)
    supply-chain-map-visual.png        (~1663x929, illustrated chain)
    ai-agent-dashboard-visual.png      (~1663x929, dashboard visual)
    produce-crates-cutout-alpha.png    (~1600x1050, transparent PNG)

They're referenced from Landing.jsx and Portal.jsx as
`/brand/<filename>` since Vite serves everything in `client/public/`
at the site root.
