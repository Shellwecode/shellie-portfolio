# Gaps Inventory — Phase 1 → Phase 2

This file is an honest record of what is missing, under-represented, or weakly sourced in the dataset. It is an input to phase 2 (data normalisation) and phase 3 (visualisation design), not a bug list to be silently closed.

## Regional gaps

### Pre-2000 Brazilian women's SF

Finisia Fideli is one entry intended to represent a whole pre-2000 Brazilian women's SF tradition that is badly under-documented in English. Names that belong in a fuller dataset:

- Sonia Sant'Anna
- Giulia Moon
- Dinah Silveira de Queiroz (1911–1982) — earlier generation, debatable SF but influential
- Ana Rüsche (more contemporary)
- Rosana Rios

Sourcing for these requires Portuguese-language scholarship (Roberto de Sousa Causo's histories are the primary reference). Phase-2 should budget specifically for Portuguese-language source review.

### MENA pre-2010 women's SF

Almost nothing. The included MENA authors (Abdel Aziz, Al-Maria, Sansour, Hareven) are all post-2010 publishers. Earlier Arabic-language women's SF is effectively invisible to Anglophone sourcing. Candidates worth investigating in phase 2:

- Salwa Bakr (Egypt) — speculative-inflected short fiction from the 1980s–90s.
- Nora Naji (Morocco/France) — some speculative shorts.
- Egyptian, Syrian, Lebanese SF writers of the 1970s–2000s: the tradition exists but is poorly accessible.

### Chinese women's novel-length SF

Short fiction is reasonably well-covered via Ken Liu's translations (*Clarkesworld*, *Invisible Planets*, *Broken Stars*). **Novels** by Chinese women SF writers in English translation are extremely sparse; Hao Jingfang's *Vagabonds* is one of very few. Chi Hui and Tang Fei have strong short-fiction careers but limited novel exposure. Phase-2 should check Storycom/Chinese-SFWA translation pipeline announcements for forthcoming novels.

### Korean women's SF pre-2000

Djuna (active since 1992) is our earliest Korean inclusion. Earlier Korean women's SF — especially from the 1970s–1980s colonial/post-colonial period — is not documented in the dataset. Whether this reflects a real thinness of the tradition or an Anglophone-source blind spot is itself a phase-2 research question.

### South Asian women's SF between Hossain (1905) and Padmanabhan (1997)

A ninety-year gap. This is almost certainly a sourcing blind spot rather than an absence of writers. Bengali, Marathi, Tamil, Urdu, Malayalam speculative fiction by women between WWI and the 1990s is a serious research gap. Relevant starting points for phase 2:

- Sukanya Datta (Bengali SF)
- Sumathi Mehta, Kamala Das (some speculative shorts)
- Ismat Chughtai (mostly realist; occasional speculative moments)

### Sri Lankan and Bangladeshi women's SF

Bangladesh is represented only by Hossain (who wrote before partition). Contemporary Bangladeshi women's SF is unrepresented. Sri Lankan women's SF is entirely absent from the dataset.

### Indigenous women's SF

Only Rebecca Roanhorse appears. Cherie Dimaline (*The Marrow Thieves*), Waubgeshig Rice (male; different author), Louise Erdrich (largely literary but with speculative threads — *Future Home of the Living God*), Darcie Little Badger, Daniel H. Wilson (male), Marie Battiste — a broader roster suggests a plausible Indigenous-Americas regional bucket in phase 2 rather than the current "other" placement.

### Non-binary / genderqueer SFF writers

The brief framed the dataset around "women science fiction writers." That framing necessarily excludes Akwaeke Emezi, Rivers Solomon, and other non-binary writers in the Afrofuturist tradition, Neon Yang, JY Yang (when they wrote as JY), and others whose work is vital to the feminist-SF conversation but whose authors are not women. Karin Tidbeck uses they/them and is included here with a note; their inclusion vs exclusion is editorial judgment that phase 2 should revisit.

## Authors likely important but thinly documented in English

- **Chi Hui** (Chinese): novel-length translations missing.
- **Kurahashi Yumiko** (Japanese): *A Round Trip to the Land of Amanon* not in English.
- **Ōhara Mariko**: only one novel in English (*Hybrid Child*, 2018); short fiction scattered.
- **Teresa P. Mira de Echeverría** (Argentina): anthology-only availability.
- **Maria Galina** (Russia): considered and cut for space; important voice of 2000s Russian fantastic literature.
- **Leena Krohn** (Finland): cut for space; one of the central Finnish Weird predecessors.
- **Tashan Mehta** (India): very recent breakout (*Mad Sisters of Esi*, 2023) cut for space.
- **Eugen Bacon** (Tanzania/Australia): substantial body of work; cut for space.

## Thematic gaps

### Disability-centred SF as a theme

The vocabulary's `embodiment` conflates disability-led SF with broader body-politics SF. Kim Choyeop (hearing loss, explicit), Nicola Griffith (MS, explicit), Vonda McIntyre (medical fiction), and Butler (chronic illness threads in *Parable of the Sower*) deserve a distinct disability tag.

### Translation-as-politics as a theme

Le Guin's Lao Tzu and Gorodischer translations, Leckie's pronoun politics, Wittig's grammatical insurrection, Tidbeck's *Amatka*, Xia Jia's cross-cultural essayism — there is a tradition of translation-as-political-act running through feminist SF that the current vocabulary tags only tangentially (via `language`).

### Afrofuturism / Africanfuturism / Gulf Futurism as movement-political identification

The `colonialism` and `race` tags do not capture the self-organised movement-political dimension. Phase-2 should consider whether to add `movement-politics` as a distinct tag or whether the geographic metadata can carry that information.

## Translation-metadata gaps

Translation history is the single weakest data class in the dataset. The per-author files give translator names and years *where known*; for many authors (Tanith Lee, Chi Hui, Brazilian women, pre-2010 Russian) the translator attribution is partial, approximate, or simply unavailable in English sources. Phase 2 should consider:

1. Scraping ISFDB.org systematically for translation-edition records.
2. Consulting WorldCat for holdings-level translation evidence.
3. Reaching out to translator organisations (PEN Translates, ALTA) for clearer attribution chains.
4. Distinguishing "confirmed translator + year" from "translation exists, translator unknown" as two distinct data states.

## Influence-edge coverage

Applied a strict sourcing rule: influence edges require a documented statement (interview, letter, scholarly citation, acknowledgement). This produces honest edges but almost certainly *under-counts* real influences. In particular:

- Peer influences within cohorts (e.g., Japanese New Wave writers in the 1970s influenced each other; direct statements per pair are missing).
- Influences mediated through translation (e.g., which Anglo-American women SF writers shaped the 1990s Korean SF formation: Djuna and Kim Bo-Young's Le Guin citations are recorded; the broader reading environment is not).
- Women-to-women chains that go undocumented because interviewers don't ask: Tanith Lee's influence on later British SFF, for instance, is patchily recorded.

Phase 2 should distinguish between **documented edges** (safe for visualisation) and a separate **plausible-edges** file that flags likely influences without asserting them.

## Metadata-format issues for phase 2

- Some authors span multiple regions: Suzuki Izumi (Japan), Hopkinson (Jamaica/Canada/US), Chaviano (Cuba/US), Ōhara (Tokyo but globally read), Serpell (Zambia/US). Region is currently single-valued; phase 2 may need a primary + secondary region field.
- Non-prose authors: Kahiu, Al-Maria, Sansour are film/visual primary. A `primary_medium` field separate from `form` may help.
- Gender: the dataset is framed around women. Tidbeck (they/them) is included with a note. A `pronouns` or `gender` field would make this explicit rather than implicit.

## What the dataset is good at

To balance the gap record: the Anglophone and East Asian regions are richly sourced with credible translation-edition records and multiple verifiable influence edges. The influence graph through Butler, Le Guin, Russ, Tiptree, and Okorafor is dense and well-sourced. Most entries have at least one direct URL and one cited scholarly or editorial source. The "influence edges as documented statements only" rule yields a graph that is smaller than the reality but safe to visualise.
