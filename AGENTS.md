<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- App data is read/written from the browser with the generated client under RLS; protected pages live under `src/routes/_authenticated/` so the shared nav shell and sign-in gate apply. Why: simple per-user CRUD with no server secrets.
- Crop planning, plant health and advisor answers are deterministic rule-based logic in `src/lib/planner.ts` and `src/lib/advice.ts`. Why: the demo must work offline from any AI service.
- All brand placements use the shared Logo component and its uploaded asset pointer; the favicon is a padded square copy of the same source. Why: keep branding consistent across pages and browser tabs.
