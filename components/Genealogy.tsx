"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import * as d3 from "d3";
import { X, ZoomIn, ZoomOut, Maximize2, BookOpen, Calendar, Sparkles } from "lucide-react";

/* ============================================================
   TYPES
   ============================================================ */

type NodeType = "patriarch" | "king" | "son" | "daughter" | "mother";
type SpouseStatus = "wife" | "handmaid" | "concubine" | "irregular";
type Orientation = "horizontal" | "vertical";

interface NodeInfo {
  pivot?: boolean;
  ghost?: boolean;
  era?: string;
  date?: string;
  role?: string;
  summary?: string;
  significance?: string;
  events?: string[];
  refs?: string[];
}

interface PersonNode extends NodeInfo {
  id: string;
  name: string;
  type: NodeType;
  /** Children whose mother is not depicted (Lukan-stub line, Ishmael when Hagar's hidden, etc.). */
  children?: PersonNode[];
  /** First-class marriages: each owns its own children. */
  spouses?: Spouse[];
}

interface Spouse {
  person: PersonNode; // type === "mother"
  status: SpouseStatus;
  children: PersonNode[];
}

interface CrossLink {
  fromId: string;
  toId: string;
  variant: "lukan-descent";
  label?: string;
}

interface LayoutPosition {
  id: string;
  node: PersonNode;
  /** Generation depth (0 = root). */
  depth: number;
  /** Position along the sibling axis (in unit rows). */
  span: number;
  isSpouse: boolean;
  /** Father's id when isSpouse. */
  parentId?: string;
  spouseStatus?: SpouseStatus;
}

type ConnectionKind = "descent" | "marriage" | "cross";

interface Connection {
  fromId: string;
  toId: string;
  from: LayoutPosition;
  to: LayoutPosition;
  kind: ConnectionKind;
  spouseStatus?: SpouseStatus;
}

/* ============================================================
   HELPERS — build the tree
   ============================================================ */

const N = (
  id: string,
  name: string,
  type: NodeType,
  info: NodeInfo,
  children?: PersonNode[],
  spouses?: Spouse[]
): PersonNode => ({ id, name, type, ...info, children, spouses });

const W = (parent: PersonNode, ...spouses: Spouse[]): PersonNode => ({
  ...parent,
  spouses,
});

const M = (
  id: string,
  name: string,
  status: SpouseStatus,
  info: NodeInfo,
  children: PersonNode[] = []
): Spouse => ({
  person: { id, name, type: "mother", ...info },
  status,
  children,
});

/* ============================================================
   GENEALOGY DATA
   ============================================================ */

const data: PersonNode = W(
  N("abraham", "Abraham", "patriarch", {
    pivot: true,
    era: "Patriarchal Age",
    date: "c. 2000 BC",
    role: "Father of nations",
    summary:
      "Called by God out of Ur of the Chaldeans; recipient of the foundational covenant promising land, descendants, and universal blessing.",
    significance:
      "Every figure in this tree descends from Abraham. The covenant in Genesis 12, 15, and 17 is the theological backbone the Bible references — Israel is the covenant family, the Messiah arrives as its fulfillment.",
    events: [
      "Leaves Ur and Haran for Canaan (Genesis 12)",
      "Covenant ceremony with the divided animals (Genesis 15)",
      "Sarah gives Hagar to bear Ishmael (Genesis 16)",
      "Renamed Abraham; circumcision instituted (Genesis 17)",
      "Birth of Isaac, the child of promise (Genesis 21)",
      "The binding of Isaac on Mount Moriah (Genesis 22)",
    ],
    refs: ["Genesis 12–25", "Romans 4", "Galatians 3", "Hebrews 11:8–19"],
  }),
  M("sarah", "Sarah", "wife", {
    era: "Patriarchal Age", date: "c. 1990 BC", role: "Wife of Abraham; mother of Isaac",
    summary: "Wife of Abraham, originally Sarai. Bore Isaac at 90 after decades of barrenness.",
    significance: "The matriarch through whom the covenant line flows. Paul reads Sarah as the figure of promise/freedom against Hagar (Galatians 4).",
    events: ["Renamed Sarah (\"princess\") at 89 (Genesis 17)", "Bore Isaac at 90 (Genesis 21)", "Died at 127, buried in the cave of Machpelah (Genesis 23)"],
    refs: ["Genesis 11–23", "Hebrews 11:11", "1 Peter 3:6"],
  }, [
    W(
      N("isaac", "Isaac", "patriarch", {
        pivot: true, era: "Patriarchal Age", date: "c. 1900 BC", role: "Child of promise",
        summary: "Born to Sarah in her old age as the fulfillment of God's promise. The covenant passes through him rather than the elder Ishmael.",
        significance: "Second of the three patriarchs. The \"binding of Isaac\" (Akedah) becomes a typological prefigurement of sacrificial substitution.",
        events: ["Born to a 90-year-old Sarah (Genesis 21)", "Bound on Mount Moriah, spared by the ram (Genesis 22)", "Married Rebekah (Genesis 24)", "Father of twins Esau and Jacob (Genesis 25)"],
        refs: ["Genesis 21–28", "Hebrews 11:17–20"],
      }),
      M("rebekah", "Rebekah", "wife", {
        era: "Patriarchal Age", date: "c. 1880 BC", role: "Wife of Isaac; mother of Esau & Jacob",
        summary: "Brought from Haran by Abraham's servant to marry Isaac. Bore twins after years of barrenness; favored Jacob and engineered his blessing.",
        significance: "Received the divine oracle that \"the older shall serve the younger\" (Genesis 25:23) — establishing the principle of election that runs through the rest of the Bible.",
        events: ["Met at the well by Abraham's servant (Genesis 24)", "Received oracle about her twins (Genesis 25:22–23)", "Helped Jacob obtain the blessing (Genesis 27)"],
        refs: ["Genesis 24–27", "Romans 9:10–13"],
      }, [
        N("esau", "Esau", "son", {
          era: "Patriarchal Age", date: "c. 1850 BC", role: "Father of Edomites",
          summary: "Firstborn twin who sold his birthright to Jacob for a bowl of stew. Settled in the hill country south of the Dead Sea.",
          significance: "Founder of Edom, perpetual rival of Israel. Herod the Great was an Idumean (Edomite) — historical irony given his role at Jesus's birth.",
          events: ["Sold birthright for lentil stew (Genesis 25)", "Lost the patriarchal blessing to Jacob (Genesis 27)", "Reconciled with Jacob (Genesis 33)"],
          refs: ["Genesis 25–36", "Obadiah", "Malachi 1:2–3"],
        }),
        W(
          N("jacob", "Jacob", "patriarch", {
            pivot: true, era: "Patriarchal Age", date: "c. 1850 BC", role: "Father of the Twelve Tribes; renamed Israel",
            summary: "Younger twin who supplanted Esau, wrestled with God at Peniel, and was renamed Israel. His twelve sons by four women became the twelve tribes.",
            significance: "The nation Israel is named for him. The tribal structure and territorial allotments after the conquest flow from his sons. His migration to Egypt sets up the Exodus.",
            events: ["Bought the birthright; stole the blessing (Genesis 25, 27)", "Vision of the ladder at Bethel (Genesis 28)", "Served Laban 14 years for Leah and Rachel", "Wrestled the angel; renamed Israel (Genesis 32)", "Family migrates to Egypt during famine (Genesis 46)"],
            refs: ["Genesis 25–50", "Hosea 12"],
          }),
          M("leah", "Leah", "wife", {
            era: "Twelve Tribes", date: "c. 1830 BC", role: "First wife of Jacob; mother of six tribes and Dinah",
            summary: "Older daughter of Laban, given to Jacob through Laban's deception. Bore six sons and a daughter, including Levi (priestly) and Judah (royal/messianic).",
            significance: "Mother of more tribes than any other woman, including the two most theologically significant: Levi and Judah.",
            events: ["Married to Jacob through Laban's switch (Genesis 29)", "Bore Reuben, Simeon, Levi, Judah, Issachar, Zebulun, and Dinah"],
            refs: ["Genesis 29–30", "Ruth 4:11"],
          }, [
            N("reuben", "Reuben", "son", { era: "Twelve Tribes", date: "c. 1815 BC", role: "Firstborn — birthright forfeited", summary: "Firstborn of Jacob; lost his birthright after sleeping with his father's concubine Bilhah.", significance: "Forfeit of firstborn rights opened the door for inheritance to pass to Joseph (double portion via Ephraim and Manasseh) and the messianic line to Judah.", events: ["Slept with Bilhah; cursed in Genesis 49:3–4"], refs: ["Genesis 35:22, 49:3–4", "1 Chronicles 5:1"] }),
            N("simeon", "Simeon", "son", { era: "Twelve Tribes", date: "c. 1813 BC", role: "Tribe absorbed into Judah", summary: "Second son of Leah; with Levi, massacred the men of Shechem in revenge for Dinah.", significance: "Cursed alongside Levi (Genesis 49:5–7); tribe was scattered and effectively absorbed into Judah's territory.", events: ["Shechem massacre (Genesis 34)"], refs: ["Genesis 34, 49:5–7"] }),
            N("levi", "Levi", "son", { pivot: true, era: "Twelve Tribes", date: "c. 1811 BC", role: "Priestly tribe — no land", summary: "Third son of Leah. The Levites became Israel's priestly tribe — Moses, Aaron, and the entire priesthood descend from him.", significance: "Although cursed for the Shechem violence, the tribe was rehabilitated at Sinai when they alone rallied to Moses against the golden calf. Received no land allotment because \"the Lord is their inheritance.\"", events: ["Faithful at the golden calf (Exodus 32)", "Aaronic priesthood instituted", "Levitical cities established (Numbers 35)"], refs: ["Exodus 32", "Numbers 3, 18, 35", "Deuteronomy 33:8–11"] }),
            W(
              N("judah", "Judah", "son", {
                pivot: true, era: "Twelve Tribes", date: "c. 1809 BC", role: "Royal / messianic tribe",
                summary: "Fourth son of Leah. After his three older brothers were disqualified, leadership and the messianic line passed to him.",
                significance: "Genesis 49:10 — \"the scepter shall not depart from Judah\" — is the foundational messianic prophecy. Every Davidic king, and ultimately Jesus, descends from Judah.",
                events: ["Suggested selling Joseph rather than killing him (Genesis 37)", "Fathered Perez through Tamar (Genesis 38)", "Pledged his own life for Benjamin's safety (Genesis 44)", "Received the messianic blessing (Genesis 49:8–12)"],
                refs: ["Genesis 38, 44, 49:8–12", "Revelation 5:5"],
              }),
              M("shua", "Bath-shua", "wife", {
                era: "Egyptian Sojourn", date: "c. 1790 BC", role: "Canaanite wife of Judah",
                summary: "Daughter of Shua the Canaanite. Mother of Judah's first three sons — Er, Onan, and Shelah.",
                significance: "Marriage to a Canaanite woman is itself unusual for the patriarchal family. Her two eldest sons die under divine judgment, opening the door for Tamar's intervention.",
                events: ["Bore Er, Onan, and Shelah (Genesis 38:1–5)"],
                refs: ["Genesis 38:1–12", "1 Chronicles 2:3"],
              }, [
                N("er", "Er", "son", {
                  era: "Egyptian Sojourn", date: "c. 1780 BC", role: "Judah's firstborn — died young",
                  summary: "Firstborn son of Judah and Bath-shua. Married Tamar, but \"was wicked in the sight of the Lord\" and died childless.",
                  significance: "His death triggers the levirate-duty crisis that becomes Tamar's narrative.",
                  events: ["Married Tamar", "Killed by the Lord (Genesis 38:7)"],
                  refs: ["Genesis 38:6–7"],
                }),
                N("onan", "Onan", "son", {
                  era: "Egyptian Sojourn", date: "c. 1778 BC", role: "Refused levirate duty — died",
                  summary: "Second son of Judah. Refused to fulfill levirate duty toward Tamar (raising up offspring for his dead brother) and was killed.",
                  significance: "His refusal is the linchpin of the Tamar story — Judah then withholds his third son Shelah, leaving Tamar in legal limbo and setting up the Genesis 38 deception.",
                  events: ["Refused levirate duty (Genesis 38:8–10)", "Killed by the Lord"],
                  refs: ["Genesis 38:8–10"],
                }),
                N("shelah", "Shelah", "son", {
                  era: "Egyptian Sojourn", date: "c. 1775 BC", role: "Third son of Judah",
                  summary: "Third son of Judah. Withheld from Tamar by his father, who feared he too would die. Founded the Shelanite clan.",
                  significance: "Father of Judahite clans listed in Numbers 26:20, but his line is bypassed in the messianic genealogy in favor of Perez.",
                  events: ["Withheld from Tamar by Judah (Genesis 38:11)"],
                  refs: ["Genesis 38:11, 26", "Numbers 26:20", "1 Chronicles 4:21–23"],
                }),
              ]),
              M("tamar", "Tamar", "irregular", {
                pivot: true, era: "Egyptian Sojourn", date: "c. 1770 BC", role: "Daughter-in-law of Judah; mother of Perez",
                summary: "Widow of Judah's eldest two sons. When Judah withheld his third son in violation of levirate duty, she disguised herself as a prostitute to obtain offspring from Judah himself.",
                significance: "First of four women Matthew names in Jesus's genealogy. Her story is interrupted in the middle of the Joseph narrative (Genesis 38) precisely to mark the beginning of the messianic line. The pairing with Judah is irregular — his daughter-in-law, not his wife — but Judah himself declared her \"more righteous than I.\"",
                events: ["Widowed twice (Genesis 38)", "Disguised as prostitute, conceived by Judah", "Vindicated when Judah said \"she is more righteous than I\""],
                refs: ["Genesis 38", "Ruth 4:12", "Matthew 1:3"],
              }, [
                N("zerah", "Zerah", "son", {
                  era: "Egyptian Sojourn", date: "c. 1750 BC", role: "Twin of Perez",
                  summary: "Twin of Perez. Reached out his hand first at birth — the midwife tied a scarlet thread on it — but Perez emerged first.",
                  significance: "The reversal of birth order (younger over elder) is a recurring messianic motif: Isaac over Ishmael, Jacob over Esau, Ephraim over Manasseh, David over his older brothers, Solomon over Adonijah. Zerah's clans appear in 1 Chronicles 2:6–8.",
                  events: ["Born with scarlet thread (Genesis 38:30)"],
                  refs: ["Genesis 38:27–30", "1 Chronicles 2:4–8", "Joshua 7 (Achan, a Zerahite)"],
                }),
                N("perez", "Perez", "son", { era: "Egyptian Sojourn", date: "c. 1750 BC", role: "Son of Judah and Tamar", summary: "Born of Tamar's bold maneuver. Twin brother Zerah grasped first but Perez emerged first — a recurring younger-supplants-older motif.", significance: "Patriarch of the Perezite clan from which David descends.", events: [], refs: ["Genesis 38", "Ruth 4:18", "1 Chronicles 2:4", "Matthew 1:3"] }, [
                  N("hezron", "Hezron", "son", { era: "Egyptian Sojourn", date: "c. 1700 BC", role: "Grandson of Judah", summary: "Bridge generation during the Egyptian sojourn.", significance: "Founding ancestor of the Hezronite clan within Judah.", events: [], refs: ["Ruth 4:18", "1 Chronicles 2:5", "Matthew 1:3"] }, [
                    N("ram", "Ram", "son", { era: "Egyptian Sojourn", date: "c. 1650 BC", role: "Son of Hezron", summary: "Mentioned only in genealogies; spans the Egyptian captivity period.", significance: "Continues the Judahite line during Israel's 400 years in Egypt.", events: [], refs: ["Ruth 4:19", "Matthew 1:3–4"] }, [
                      N("amminadab", "Amminadab", "son", { era: "Exodus Era", date: "c. 1450 BC", role: "Father-in-law of Aaron", summary: "His daughter Elisheba married Aaron the high priest, joining the Judahite royal line to the Levitical priesthood.", significance: "First marriage between Judah and Levi — royal and priestly tribes — prefigures the Christ who unites both offices.", events: ["Daughter Elisheba married Aaron (Exodus 6:23)"], refs: ["Exodus 6:23", "Ruth 4:19–20", "Matthew 1:4"] }, [
                        N("nahshon", "Nahshon", "son", { era: "Exodus Era", date: "c. 1400 BC", role: "Prince of Judah at Sinai", summary: "Leader of the tribe of Judah during the wilderness wanderings.", significance: "Jewish tradition holds Nahshon was the first to step into the Red Sea, prompting its parting. Brother-in-law of Aaron.", events: ["Census leader of Judah (Numbers 1:7)", "Presented offerings first at the tabernacle dedication"], refs: ["Numbers 1:7, 7:12", "Matthew 1:4"] }, [
                          W(
                            N("salmon", "Salmon", "son", { era: "Conquest", date: "c. 1380 BC", role: "Husband of Rahab", summary: "Lived during Joshua's conquest of Canaan.", significance: "His marriage to Rahab grafts a Canaanite into the messianic line.", events: ["Married Rahab after the fall of Jericho"], refs: ["Ruth 4:20–21", "Matthew 1:5", "Joshua 2, 6"] }),
                            M("rahab", "Rahab", "wife", {
                              pivot: true, era: "Conquest", date: "c. 1370 BC", role: "Canaanite of Jericho; mother of Boaz",
                              summary: "Prostitute of Jericho who hid the Israelite spies, securing safe passage for her family when the city fell. Married into the tribe of Judah.",
                              significance: "Second of Matthew's four women. Gentile, prostitute, declared righteous by faith (Hebrews 11:31) and works (James 2:25) — a remarkable theological convergence.",
                              events: ["Hid the spies; lowered them by a scarlet cord (Joshua 2)", "Family spared at the fall of Jericho (Joshua 6)", "Married Salmon, fathered Boaz"],
                              refs: ["Joshua 2, 6", "Matthew 1:5", "Hebrews 11:31", "James 2:25"],
                            }, [
                              W(
                                N("boaz", "Boaz", "son", { pivot: true, era: "Judges Era", date: "c. 1150 BC", role: "Kinsman-redeemer of Ruth", summary: "Wealthy landowner of Bethlehem who married the Moabite widow Ruth under the kinsman-redeemer custom.", significance: "The kinsman-redeemer (goel) role becomes a major Christological type — Christ as the redeemer who pays the price to restore the inheritance.", events: ["Allowed Ruth to glean (Ruth 2)", "Redeemed Naomi's land and married Ruth (Ruth 4)"], refs: ["Ruth 2–4", "Matthew 1:5"] }),
                                M("ruth", "Ruth", "wife", {
                                  pivot: true, era: "Judges Era", date: "c. 1140 BC", role: "Moabite widow; mother of Obed",
                                  summary: "Moabite woman who clung to her widowed mother-in-law Naomi after her own husband died, swearing the famous oath \"your people shall be my people, and your God my God.\"",
                                  significance: "Third of Matthew's four women. A Moabite — an ethnic group cursed in Deuteronomy 23:3 — is grafted into the line of David. The book of Ruth is essentially the origin story of David's great-grandparents.",
                                  events: ["Refused to leave Naomi (Ruth 1:16)", "Gleaned in Boaz's field (Ruth 2)", "Threshing-floor proposal (Ruth 3)", "Married Boaz; bore Obed (Ruth 4)"],
                                  refs: ["Ruth 1–4", "Matthew 1:5"],
                                }, [
                                  N("obed", "Obed", "son", { era: "Judges Era", date: "c. 1130 BC", role: "Father of Jesse", summary: "Son of Boaz and Ruth, raised symbolically as the heir of Naomi.", significance: "Bridge generation connecting the Ruth narrative to the Davidic monarchy.", events: [], refs: ["Ruth 4:17, 21–22", "Matthew 1:5"] }, [
                                    N("jesse", "Jesse", "son", { era: "Late Judges", date: "c. 1100 BC", role: "Father of David", summary: "Bethlehemite shepherd-farmer, father of eight sons including David, the youngest.", significance: "Isaiah 11:1 prophesies the Messiah as \"a shoot from the stump of Jesse\" — making \"Jesse\" itself a messianic title.", events: ["Hosted Samuel's anointing of David (1 Samuel 16)"], refs: ["1 Samuel 16, 17", "Isaiah 11:1, 10", "Matthew 1:5–6"] }, [
                                      W(
                                        N("david", "David", "king", {
                                          pivot: true, era: "United Monarchy", date: "r. 1010–970 BC", role: "King of Israel",
                                          summary: "Shepherd, warrior, poet, second king of Israel. Founder of the dynasty that ruled Judah for over 400 years.",
                                          significance: "The Davidic Covenant (2 Samuel 7) promises an eternal throne — the foundational messianic promise the New Testament treats as fulfilled in Jesus. \"Son of David\" becomes the standard messianic title. Both Matthew (through Solomon) and Luke (through Nathan) trace Jesus's lineage to David.",
                                          events: ["Anointed by Samuel as a youth (1 Samuel 16)", "Killed Goliath (1 Samuel 17)", "Captured Jerusalem (2 Samuel 5)", "Davidic Covenant (2 Samuel 7)", "Affair with Bathsheba; murder of Uriah (2 Samuel 11)", "Author of many Psalms"],
                                          refs: ["1 Samuel 16 – 1 Kings 2", "Psalms", "2 Samuel 7", "Matthew 1:6", "Luke 3:31"],
                                        }),
                                        M("bathsheba", "Bathsheba", "wife", {
                                          pivot: true, era: "United Monarchy", date: "c. 990 BC", role: "Wife of David; mother of Solomon and Nathan",
                                          summary: "Wife of Uriah the Hittite, taken by David in adultery. Their first child died as judgment; their later sons included Solomon and Nathan — the two ancestors through whom Matthew and Luke each trace Jesus.",
                                          significance: "Fourth of Matthew's four women — and the only one Matthew refuses to name directly, calling her \"the wife of Uriah\" to keep the scandal in view. Politically she secured Solomon's succession against the older claim of Adonijah. 1 Chronicles 3:5 lists her sons as Shimea, Shobab, Nathan, and Solomon.",
                                          events: ["Affair with David, death of Uriah (2 Samuel 11)", "First child died (2 Samuel 12)", "Bore Shimea, Shobab, Nathan, and Solomon", "Secured Solomon's throne (1 Kings 1)"],
                                          refs: ["2 Samuel 11–12", "1 Kings 1–2", "1 Chronicles 3:5", "Matthew 1:6"],
                                        }, [
                                          /* ---------- LUKAN BRANCH (David → Nathan → … → Heli) ---------- */
                                          N("nathan-david", "Nathan", "son", {
                                            pivot: true, era: "United Monarchy", date: "c. 985 BC", role: "Son of David — Lukan branch",
                                            summary: "Third son of David and Bathsheba (1 Chronicles 3:5). Distinct from Nathan the prophet. Luke 3:31 traces Jesus's lineage through this Nathan rather than through Solomon.",
                                            significance: "The split point of the two New Testament genealogies. Matthew's royal-legal line goes through Solomon; Luke's biological line goes through Nathan and reaches Mary's father Heli forty-plus generations later. The Mary–Joseph marriage rejoins the two lines at Jesus.",
                                            events: ["Born to David and Bathsheba in Jerusalem", "House of Nathan mourned separately in Zechariah 12:12"],
                                            refs: ["2 Samuel 5:14", "1 Chronicles 3:5", "Zechariah 12:12", "Luke 3:31"],
                                          }, [
                                            N("lukan-stub", "Lukan line · ~40 generations", "son", {
                                              era: "Late Monarchy → Roman Period",
                                              date: "c. 985 BC – c. 50 BC",
                                              role: "Mattatha → Menna → Melea → … → Matthat",
                                              summary: "Luke 3:23–31 lists roughly forty generations between Nathan son of David and Heli, father of Mary. Names include Mattatha, Menna, Melea, Eliakim, Jonam, Joseph, Judah, Simeon, Levi, Matthat, Jorim, Eliezer, Joshua, Er, Elmadam, Cosam, Addi, Melchi, Neri, Shealtiel, Zerubbabel (rejoining briefly with Matthew before splitting again), Rhesa, Joanan, Joda, Josech, Semein, Mattathias, Maath, Naggai, Esli, Nahum, Amos, Mattathias, Joseph, Jannai, Melki, Levi, Matthat.",
                                              significance: "Luke's list is twice the length of Matthew's. Most of these names appear nowhere else in Scripture — they are the silent custodians of David's biological line through the centuries when the throne itself had been lost. This compressed node represents the entire span; the cross-link from Heli to Mary visualizes how the line rejoins the messianic story.",
                                              events: [],
                                              refs: ["Luke 3:23–31"],
                                            }, [
                                              N("heli", "Heli", "son", {
                                                pivot: true, era: "Roman Period", date: "c. 50 BC – c. 10 BC", role: "Father of Mary (Luke 3:23)",
                                                summary: "Named in Luke 3:23 as the father of Joseph — read by most interpreters since the Reformation as Joseph's father-in-law, i.e., Mary's father, since Matthew names Jacob as Joseph's actual father. Under this reading, Luke's genealogy traces Mary's biological descent.",
                                                significance: "The endpoint of Luke's parallel descent line. The dashed cross-link to Mary shows where the Lukan biological line rejoins the Matthean legal line at the marriage of Mary and Joseph.",
                                                events: ["Father of Mary"],
                                                refs: ["Luke 3:23"],
                                              }),
                                            ]),
                                          ]),
                                          /* ---------- MATTHEAN BRANCH (David → Solomon → kings of Judah → Joseph) ---------- */
                                          W(
                                            N("solomon", "Solomon", "king", {
                                              pivot: true, era: "United Monarchy", date: "r. 970–930 BC", role: "Builder of the First Temple",
                                              summary: "Son of David and Bathsheba. Famous for wisdom and the Temple in Jerusalem.",
                                              significance: "Built the First Temple, centralizing Israelite worship. His later compromises with foreign wives and pagan worship triggered the kingdom split. Traditional author of Proverbs, Ecclesiastes, and Song of Songs.",
                                              events: ["Anointed king while David lived (1 Kings 1)", "Asked God for wisdom (1 Kings 3)", "Built the First Temple (1 Kings 6)", "Married 700 wives, 300 concubines", "Idolatry sets up the kingdom division"],
                                              refs: ["1 Kings 1–11", "2 Chronicles 1–9", "Matthew 1:6–7"],
                                            }),
                                            M("naamah", "Naamah", "wife", {
                                              era: "United Monarchy", date: "c. 950 BC", role: "Ammonite wife of Solomon; mother of Rehoboam",
                                              summary: "One of Solomon's many foreign wives — an Ammonite. Mother of his successor.",
                                              significance: "A foreign wife producing the heir to Israel's throne reflects the very intermarriage compromise that 1 Kings 11 condemns.",
                                              events: ["Bore Rehoboam, Solomon's successor"],
                                              refs: ["1 Kings 14:21, 31", "2 Chronicles 12:13"],
                                            }, [
                                              N("rehoboam", "Rehoboam", "king", {
                                                pivot: true, era: "Divided Kingdom", date: "r. 930–913 BC", role: "King under whom kingdom split",
                                                summary: "Son of Solomon and Naamah whose harsh response to northern grievances triggered the secession of the ten northern tribes.",
                                                significance: "Kingdom permanently divides into Israel (north, 10 tribes) and Judah (south). The Davidic line continues only in the southern kingdom. Northern tribes destroyed by Assyria in 722 BC; only Judah survives to exile and return.",
                                                events: ["Refused to lighten Solomon's tax burden (1 Kings 12)", "Lost the northern ten tribes to Jeroboam", "Egyptian Pharaoh Shishak plundered Jerusalem"],
                                                refs: ["1 Kings 12, 14", "2 Chronicles 10–12", "Matthew 1:7"],
                                              }, [
                                                N("abijah", "Abijah", "king", { era: "Divided Kingdom", date: "r. 913–911 BC", role: "King of Judah", summary: "Brief reign marked by war with the northern kingdom.", significance: "Continued the Davidic line through a turbulent generation.", events: [], refs: ["1 Kings 15", "2 Chronicles 13", "Matthew 1:7"] }, [
                                                  N("asa", "Asa", "king", { era: "Divided Kingdom", date: "r. 911–870 BC", role: "Reformer king", summary: "Initiated religious reforms removing idols.", significance: "First of several reform kings (Asa, Jehoshaphat, Hezekiah, Josiah) attempting to return Judah to covenant faithfulness.", events: ["Removed idols and high places", "Defeated Ethiopian invasion"], refs: ["1 Kings 15", "2 Chronicles 14–16", "Matthew 1:7–8"] }, [
                                                    N("jehoshaphat", "Jehoshaphat", "king", { era: "Divided Kingdom", date: "r. 870–848 BC", role: "Reformer king", summary: "Strengthened Judah militarily and judicially; sent Levites to teach the Law.", significance: "High point of post-Solomonic Judah. Allied with Ahab of Israel — politically pragmatic but spiritually compromising.", events: ["Judicial reforms", "Allied with Ahab (1 Kings 22)"], refs: ["1 Kings 22", "2 Chronicles 17–20", "Matthew 1:8"] }, [
                                                      W(
                                                        N("joram", "Joram", "king", { era: "Divided Kingdom", date: "r. 848–841 BC", role: "King of Judah; married Athaliah", summary: "Married Athaliah daughter of Ahab and Jezebel, importing Baal worship into Judah. Killed his own brothers to secure the throne.", significance: "Matthew skips the next three kings (Ahaziah, Joash, Amaziah) here — likely to fit his 14-generation pattern. The throne, however, descended through them historically.", events: ["Married Athaliah", "Killed all his brothers"], refs: ["2 Kings 8", "2 Chronicles 21", "Matthew 1:8"] }),
                                                        M("athaliah", "Athaliah", "wife", {
                                                          era: "Divided Kingdom", date: "c. 870 – 835 BC", role: "Daughter of Ahab and Jezebel; queen-usurper",
                                                          summary: "Daughter of Ahab king of Israel and Jezebel. After her son Ahaziah was killed by Jehu, she massacred the royal family and seized the Judahite throne for six years — the only woman to reign over Judah.",
                                                          significance: "Her usurpation almost extinguished the Davidic line. Only the infant Joash, hidden in the Temple by his aunt Jehosheba, survived. The preservation of David's line through this near-extinction is one of the most precarious moments in the messianic story.",
                                                          events: ["Married Joram of Judah", "Bore Ahaziah", "Massacred royal family on Ahaziah's death (2 Kings 11)", "Reigned six years; killed in coup that crowned Joash"],
                                                          refs: ["2 Kings 8:18, 26", "2 Kings 11", "2 Chronicles 22–23"],
                                                        }, [
                                                          N("ahaziah", "Ahaziah", "king", {
                                                            ghost: true, era: "Divided Kingdom", date: "r. 841 BC", role: "King of Judah · skipped by Matthew",
                                                            summary: "Son of Joram and Athaliah. Reigned just one year; killed by Jehu while visiting his cousin Joram of Israel.",
                                                            significance: "First of three consecutive kings Matthew omits from his genealogy (likely to compress to 14 generations). Historically real and on the throne. His death triggered Athaliah's six-year usurpation.",
                                                            events: ["Allied with Joram of Israel against Hazael of Aram", "Killed by Jehu (2 Kings 9:27)"],
                                                            refs: ["2 Kings 8:25–29", "2 Kings 9:27–29", "2 Chronicles 22:1–9"],
                                                          }, [
                                                            N("joash", "Joash", "king", {
                                                              ghost: true, era: "Divided Kingdom", date: "r. 835–796 BC", role: "King of Judah · skipped by Matthew",
                                                              summary: "Hidden as an infant by his aunt Jehosheba during Athaliah's massacre. Crowned at seven by the priest Jehoiada, who ruled as regent. Repaired the Temple but later murdered Jehoiada's son and was assassinated himself.",
                                                              significance: "His survival is the moment the Davidic line was preserved by the thinnest of margins. Matthew skips him; Chronicles devotes two chapters.",
                                                              events: ["Hidden in the Temple six years (2 Kings 11)", "Crowned at age seven", "Repaired the Temple", "Murdered Zechariah son of Jehoiada", "Assassinated by his servants"],
                                                              refs: ["2 Kings 11–12", "2 Chronicles 22:10–24:27"],
                                                            }, [
                                                              N("amaziah", "Amaziah", "king", {
                                                                ghost: true, era: "Divided Kingdom", date: "r. 796–767 BC", role: "King of Judah · skipped by Matthew",
                                                                summary: "Son of Joash. Defeated Edom but then worshiped the Edomite gods. Provoked a disastrous war with Israel; Jerusalem was sacked. Assassinated at Lachish.",
                                                                significance: "Last of the three kings Matthew omits. The compression in Matthew 1:8 (\"Joram begat Uzziah\") collapses about sixty years of monarchy.",
                                                                events: ["Defeated Edom (2 Kings 14)", "Worshiped Edomite gods", "Defeated by Joash of Israel; Jerusalem walls broken", "Assassinated at Lachish"],
                                                                refs: ["2 Kings 14", "2 Chronicles 25"],
                                                              }, [
                                                                N("uzziah", "Uzziah", "king", { era: "Divided Kingdom", date: "r. 792–740 BC", role: "Long, prosperous reign", summary: "Reigned 52 years; expanded Judah territory and military. Struck with leprosy after presuming to offer incense in the Temple.", significance: "Isaiah's call to prophetic ministry came \"in the year that King Uzziah died\" (Isaiah 6:1). Contemporary of Amos and Hosea. Matthew calls him the son of Joram, compressing past Ahaziah, Joash, and Amaziah.", events: ["Military expansion", "Struck with leprosy for Temple presumption"], refs: ["2 Kings 14–15", "2 Chronicles 26", "Isaiah 6:1", "Matthew 1:8–9"] }, [
                                                                  N("jotham", "Jotham", "king", { era: "Divided Kingdom", date: "r. 750–732 BC", role: "King of Judah", summary: "Co-regent during his father's leprosy. Faithful king but did not remove the high places.", significance: "Reigned during the rise of the Assyrian threat under Tiglath-Pileser III.", events: ["Built the Upper Gate of the Temple", "Defeated the Ammonites"], refs: ["2 Kings 15", "2 Chronicles 27", "Matthew 1:9"] }, [
                                                                    N("ahaz", "Ahaz", "king", { era: "Divided Kingdom", date: "r. 732–716 BC", role: "Apostate king", summary: "Sacrificed his own son in fire; closed the Temple; appealed to Assyria for help.", significance: "Recipient of the Immanuel prophecy (Isaiah 7:14) — the sign of a virgin's son the New Testament applies to Jesus's birth.", events: ["Refused Isaiah's sign; given Immanuel prophecy", "Submitted Judah as Assyrian vassal"], refs: ["2 Kings 16", "2 Chronicles 28", "Isaiah 7", "Matthew 1:9"] }, [
                                                                      N("hezekiah", "Hezekiah", "king", { pivot: true, era: "Divided Kingdom", date: "r. 716–687 BC", role: "Reformer king", summary: "Reopened and cleansed the Temple; survived Sennacherib's siege of Jerusalem in 701 BC by miraculous intervention.", significance: "High point of the Davidic monarchy. Contemporary of Isaiah and Micah. The Assyrian crisis under his reign destroyed the northern kingdom (722 BC) but Judah was preserved — sustaining the messianic line.", events: ["Religious reform (2 Chronicles 29)", "Survived Sennacherib's siege", "Healed and given 15 extra years of life"], refs: ["2 Kings 18–20", "2 Chronicles 29–32", "Isaiah 36–39", "Matthew 1:9–10"] }, [
                                                                        N("manasseh-king", "Manasseh", "king", { era: "Divided Kingdom", date: "r. 697–642 BC", role: "Longest-reigning king", summary: "Reigned 55 years — longest of any Judahite king. Reversed his father's reforms, practiced child sacrifice. Imprisoned by Assyria, repented in captivity.", significance: "His apostasy is cited as the final cause of the Babylonian exile (2 Kings 23:26–27). Distinct from Manasseh son of Joseph.", events: ["Massive idolatry; child sacrifice", "Captured by Assyria, then restored after repentance"], refs: ["2 Kings 21", "2 Chronicles 33", "Matthew 1:10"] }, [
                                                                          N("amon", "Amon", "king", { era: "Divided Kingdom", date: "r. 642–640 BC", role: "King of Judah", summary: "Continued his father's early apostasy; assassinated by his own servants after just two years.", significance: "His assassination brought the eight-year-old Josiah to the throne — setting up the last great reform.", events: ["Assassinated by his servants"], refs: ["2 Kings 21", "2 Chronicles 33", "Matthew 1:10"] }, [
                                                                            N("josiah", "Josiah", "king", { pivot: true, era: "Divided Kingdom", date: "r. 640–609 BC", role: "Last great reformer", summary: "Came to the throne at eight. The Book of the Law was rediscovered during Temple repairs in his 18th year, triggering the most thorough reform in Judah's history.", significance: "The last hope before exile. Killed at Megiddo opposing Pharaoh Necho. Contemporary of Jeremiah.", events: ["Discovery of the Book of the Law (2 Kings 22)", "Covenant renewal and Passover (2 Kings 23)", "Killed at Megiddo (609 BC)"], refs: ["2 Kings 22–23", "2 Chronicles 34–35", "Jeremiah 1", "Matthew 1:10–11"] }, [
                                                                              N("jeconiah", "Jeconiah", "king", { pivot: true, era: "Babylonian Exile", date: "r. 598 BC", role: "Last Davidic king before exile", summary: "Reigned only three months before Nebuchadnezzar deported him to Babylon in 597 BC. Jerusalem and the Temple destroyed eleven years later in 586 BC.", significance: "The exile pivot. Jeremiah pronounced him \"childless\" in the sense that no descendant would sit on David's throne (Jeremiah 22:30) — yet Matthew lists him in Jesus's line. Tension resolved by reading the curse as applying to immediate succession.", events: ["Deported to Babylon at 18", "Released from prison after 37 years", "Cursed by Jeremiah"], refs: ["2 Kings 24–25", "Jeremiah 22:24–30", "Matthew 1:11–12"] }, [
                                                                                N("shealtiel", "Shealtiel", "son", { era: "Babylonian Exile", date: "c. 580 BC", role: "Father of Zerubbabel", summary: "Son of the exiled king. Some texts call him the legal rather than biological father of Zerubbabel.", significance: "Bridge generation between destruction of Jerusalem and post-exilic return.", events: [], refs: ["1 Chronicles 3:17", "Ezra 3:2", "Matthew 1:12"] }, [
                                                                                  N("zerubbabel", "Zerubbabel", "son", { pivot: true, era: "Post-Exilic Return", date: "c. 538 BC", role: "Led the return from Babylon", summary: "Davidic governor who led the first wave of returnees from Babylon under Cyrus's decree and oversaw the rebuilding of the Second Temple, completed in 516 BC.", significance: "The signet ring imagery of Haggai 2:23 — reversing the curse on Jeconiah — declares Zerubbabel chosen, signaling the messianic line is preserved. Last Davidic figure with significant Old Testament narrative.", events: ["Led return from Babylon (Ezra 1–2)", "Rebuilt the altar and laid Temple foundation", "Completed the Second Temple, 516 BC"], refs: ["Ezra 2–6", "Haggai 1–2", "Zechariah 4", "Matthew 1:12–13"] }, [
                                                                                    N("abiud", "Abiud", "son", { era: "Intertestamental", date: "c. 500 BC", role: "Davidic descendant", summary: "First of the post-exilic generations known only from Matthew's genealogy.", significance: "Begins the silent period — five centuries during which the Davidic line is preserved but obscure.", events: [], refs: ["Matthew 1:13"] }, [
                                                                                      N("eliakim", "Eliakim", "son", { era: "Intertestamental", date: "c. 460 BC", role: "Davidic descendant", summary: "Listed only in Matthew's genealogy.", significance: "Continues the obscure preservation of David's line during the Persian period.", events: [], refs: ["Matthew 1:13"] }, [
                                                                                        N("azor", "Azor", "son", { era: "Intertestamental", date: "c. 420 BC", role: "Davidic descendant", summary: "Persian-era descendant.", significance: "Spans the era of Ezra and Nehemiah.", events: [], refs: ["Matthew 1:14"] }, [
                                                                                          N("zadok", "Zadok", "son", { era: "Intertestamental", date: "c. 380 BC", role: "Davidic descendant", summary: "Late Persian / early Hellenistic period.", significance: "Hidden line; Greek-speaking world begins to take shape.", events: [], refs: ["Matthew 1:14"] }, [
                                                                                            N("achim", "Achim", "son", { era: "Intertestamental", date: "c. 320 BC", role: "Davidic descendant", summary: "Hellenistic period descendant.", significance: "Spans the era of Alexander's conquests.", events: [], refs: ["Matthew 1:14"] }, [
                                                                                              N("eliud", "Eliud", "son", { era: "Intertestamental", date: "c. 250 BC", role: "Davidic descendant", summary: "Roughly contemporary with the Septuagint translation in Alexandria.", significance: "Greek influence reshaping Jewish life.", events: [], refs: ["Matthew 1:15"] }, [
                                                                                                N("eleazar", "Eleazar", "son", { era: "Intertestamental", date: "c. 180 BC", role: "Davidic descendant", summary: "Lived during the Maccabean revolt era — when a non-Davidic priestly dynasty (Hasmoneans) seized the throne.", significance: "The Davidic claim remains theological while the Hasmoneans rule politically.", events: [], refs: ["Matthew 1:15"] }, [
                                                                                                  N("matthan", "Matthan", "son", { era: "Late Second Temple", date: "c. 100 BC", role: "Davidic descendant", summary: "Late Hasmonean / early Roman era ancestor.", significance: "Two generations from Joseph of Nazareth.", events: [], refs: ["Matthew 1:15"] }, [
                                                                                                    N("jacob-matthan", "Jacob", "son", { era: "Roman Period", date: "c. 50 BC", role: "Father of Joseph of Nazareth", summary: "Father of Joseph the carpenter.", significance: "Bears the same name as the patriarch — bookending the genealogy.", events: [], refs: ["Matthew 1:16"] }, [
                                                                                                      W(
                                                                                                        N("joseph-nazareth", "Joseph", "son", {
                                                                                                          pivot: true, era: "Roman Period", date: "c. 20 BC – c. 30 AD", role: "Legal father of Jesus",
                                                                                                          summary: "Carpenter of Nazareth, betrothed to Mary. Received angelic confirmation of Mary's pregnancy in a dream.",
                                                                                                          significance: "Provides Jesus's legal Davidic descent. His adoption of Jesus through naming him conveys royal lineage in Jewish law. Disappears from the narrative by Jesus's public ministry — likely deceased.",
                                                                                                          events: ["Betrothed to Mary; angelic vision", "Census journey to Bethlehem", "Flight to Egypt to escape Herod", "Last mentioned at Temple visit when Jesus was 12"],
                                                                                                          refs: ["Matthew 1–2", "Luke 1–2"],
                                                                                                        }),
                                                                                                        M("mary", "Mary", "wife", {
                                                                                                          pivot: true, era: "Roman Period", date: "c. 18 BC – c. 50 AD", role: "Mother of Jesus; daughter of Heli (Luke 3:23)",
                                                                                                          summary: "Young Jewish woman of Nazareth, betrothed to Joseph. Conceived Jesus by the Holy Spirit, fulfilling Isaiah 7:14.",
                                                                                                          significance: "The biological link to David through Luke's alternative genealogy — daughter of Heli, descended through Nathan rather than Solomon. Her Magnificat (Luke 1:46–55) is one of the most theologically rich texts in the New Testament. The Heli → Mary link visualized as the dashed cross-link in this chart.",
                                                                                                          events: ["Annunciation by the angel Gabriel (Luke 1)", "The Magnificat", "Birth in Bethlehem", "Flight to Egypt", "Present at the crucifixion (John 19)", "Present at Pentecost (Acts 1)"],
                                                                                                          refs: ["Luke 1–2", "Luke 3:23", "Matthew 1–2", "John 2, 19", "Acts 1:14"],
                                                                                                        }, [
                                                                                                          N("jesus", "Jesus", "patriarch", {
                                                                                                            pivot: true, era: "Roman Period", date: "c. 4 BC – c. 30 AD", role: "Messiah",
                                                                                                            summary: "Born in Bethlehem during the reign of Herod the Great. Presented in the New Testament as the fulfillment of every covenant traced through this entire genealogy.",
                                                                                                            significance: "The endpoint Matthew is constructing the genealogy toward. Three sets of fourteen generations (14 = numerical value of \"David\" in Hebrew) make the Davidic claim structurally explicit. Luke's genealogy traces through Nathan and back to Adam, framing Jesus as the second Adam.",
                                                                                                            events: ["Born in Bethlehem (c. 4 BC)", "Ministry began c. 27 AD", "Crucified under Pontius Pilate", "Resurrection on the third day", "Ascension"],
                                                                                                            refs: ["Matthew 1:16–25", "Luke 1–2", "Galatians 4:4", "Hebrews 1", "Revelation 22:16"],
                                                                                                          }),
                                                                                                        ]),
                                                                                                      ),
                                                                                                    ]),
                                                                                                  ]),
                                                                                                ]),
                                                                                              ]),
                                                                                            ]),
                                                                                          ]),
                                                                                        ]),
                                                                                      ]),
                                                                                    ]),
                                                                                  ]),
                                                                                ]),
                                                                              ]),
                                                                            ]),
                                                                          ]),
                                                                        ]),
                                                                      ]),
                                                                    ]),
                                                                  ]),
                                                                ]),
                                                              ]),
                                                            ]),
                                                          ]),
                                                        ]),
                                                      ),
                                                    ]),
                                                  ]),
                                                ]),
                                              ]),
                                            ]),
                                          ),
                                        ]),
                                      ),
                                    ]),
                                  ]),
                                ]),
                              ),
                            ]),
                          ),
                        ]),
                      ]),
                    ]),
                  ]),
                ]),
              ]),
            ),
            N("issachar", "Issachar", "son", { era: "Twelve Tribes", date: "c. 1807 BC", role: "Tribe of Issachar", summary: "Fifth son of Leah.", significance: "Settled in fertile lower Galilee. Tribe blessed for understanding \"the times\" (1 Chronicles 12:32).", events: [], refs: ["Genesis 49:14–15"] }),
            N("zebulun", "Zebulun", "son", { era: "Twelve Tribes", date: "c. 1805 BC", role: "Tribe of Zebulun", summary: "Sixth and last son of Leah; tribe of seafarers per Genesis 49:13.", significance: "Galilee region — Isaiah 9:1–2 prophesies \"the people walking in darkness\" of Zebulun would see a great light, fulfilled in Jesus's Galilean ministry.", events: [], refs: ["Genesis 49:13", "Isaiah 9:1–2", "Matthew 4:13–16"] }),
            N("dinah", "Dinah", "daughter", {
              era: "Twelve Tribes", date: "c. 1803 BC", role: "Only named daughter of Jacob",
              summary: "Daughter of Jacob and Leah. Violated by Shechem son of Hamor in the city of Shechem; her brothers Simeon and Levi took bloody revenge by tricking the men of the city into circumcision and slaughtering them while incapacitated.",
              significance: "The Shechem incident permanently colored the destinies of Simeon and Levi — Jacob cursed both in Genesis 49:5–7. Levi's curse was later transformed into priestly service; Simeon's tribe was scattered.",
              events: ["Violated by Shechem (Genesis 34:1–4)", "Simeon and Levi avenged her (Genesis 34:25–31)"],
              refs: ["Genesis 30:21", "Genesis 34", "Genesis 49:5–7"],
            }),
          ]),
          M("rachel", "Rachel", "wife", {
            era: "Twelve Tribes", date: "c. 1825 BC", role: "Beloved wife of Jacob; mother of Joseph and Benjamin",
            summary: "Younger daughter of Laban, the woman Jacob loved. After years of barrenness bore Joseph; died in childbirth bearing Benjamin.",
            significance: "Her tomb near Bethlehem becomes a symbol of national grief — Jeremiah 31:15 \"Rachel weeping for her children\" is applied by Matthew to Herod's slaughter of the Bethlehem infants.",
            events: ["Met Jacob at the well (Genesis 29)", "Stole her father's household gods (Genesis 31)", "Bore Joseph after long barrenness", "Died bearing Benjamin (Genesis 35)"],
            refs: ["Genesis 29–35", "Jeremiah 31:15", "Matthew 2:18"],
          }, [
            W(
              N("joseph-egypt", "Joseph", "son", {
                pivot: true, era: "Twelve Tribes / Egypt", date: "c. 1800 BC", role: "Vizier of Egypt",
                summary: "Sold into slavery by his brothers, rose to second-in-command of Egypt, and saved his family from famine — placing Israel in Egypt for 400 years.",
                significance: "Joseph never had a tribe named for him. Instead his two sons Ephraim and Manasseh each received a full tribal allotment — a \"double portion\" inheritance taking the place of Reuben's forfeited firstborn rights.",
                events: ["Sold into slavery by his brothers (Genesis 37)", "Imprisoned over Potiphar's wife", "Interpreted Pharaoh's dreams; made vizier (Genesis 41)", "Reconciled with brothers; brought Israel to Egypt", "Adopted Ephraim and Manasseh (Genesis 48)"],
                refs: ["Genesis 37–50", "Hebrews 11:22"],
              }),
              M("asenath", "Asenath", "wife", {
                era: "Egyptian Sojourn", date: "c. 1780 BC", role: "Egyptian wife of Joseph; mother of Ephraim & Manasseh",
                summary: "Daughter of Potiphera, priest of On (Heliopolis). Given to Joseph by Pharaoh as part of his elevation.",
                significance: "An Egyptian woman becomes the mother of two of Israel's tribes — the most prominent gentile inclusion in the patriarchal era.",
                events: ["Married Joseph (Genesis 41:45)"], refs: ["Genesis 41:45, 50; 46:20"],
              }, [
                N("ephraim", "Ephraim", "son", { era: "Twelve Tribes", date: "c. 1770 BC", role: "Tribe of Ephraim", summary: "Younger son of Joseph; received the greater blessing despite being younger.", significance: "Dominant northern tribe; \"Ephraim\" becomes synonymous with the entire northern kingdom in many prophetic texts.", events: ["Adopted and blessed by Jacob with the right-hand blessing (Genesis 48)"], refs: ["Genesis 48", "Hosea 4–14"] }),
                N("manasseh-tribe", "Manasseh", "son", { era: "Twelve Tribes", date: "c. 1772 BC", role: "Tribe of Manasseh", summary: "Elder son of Joseph; tribe split with half east and half west of the Jordan.", significance: "Distinct from King Manasseh. The largest tribal territory by area, bridging both sides of the Jordan.", events: [], refs: ["Genesis 48", "Numbers 32", "Joshua 13, 17"] }),
              ]),
            ),
            N("benjamin", "Benjamin", "son", {
              pivot: true, era: "Twelve Tribes", date: "c. 1790 BC", role: "Tribe of Benjamin",
              summary: "Youngest son of Jacob; only full brother of Joseph. Rachel died bearing him, naming him Ben-Oni (\"son of my sorrow\") before Jacob renamed him Benjamin (\"son of the right hand\").",
              significance: "Tribe produced Israel's first king Saul. After the kingdom split, Benjamin was the only tribe besides Judah that remained loyal to David's house. The apostle Paul was also from Benjamin.",
              events: ["Birth of Benjamin; death of Rachel (Genesis 35)", "Centerpiece of Joseph's reconciliation drama (Genesis 42–45)", "Tribe nearly annihilated in the Gibeah civil war", "Saul anointed first king (1 Samuel 9–10)"],
              refs: ["Genesis 35, 42–45", "Judges 19–21", "1 Samuel 9", "Philippians 3:5"],
            }),
          ]),
          M("bilhah", "Bilhah", "handmaid", {
            era: "Twelve Tribes", date: "c. 1820 BC", role: "Rachel's handmaid; mother of Dan & Naphtali",
            summary: "Maidservant given to Jacob as a surrogate when Rachel was unable to conceive.",
            significance: "Her sons counted as Rachel's legally; established two of the twelve tribes.",
            events: [], refs: ["Genesis 30:1–8"],
          }, [
            N("dan", "Dan", "son", { era: "Twelve Tribes", date: "c. 1818 BC", role: "Tribe of Dan", summary: "Eldest son of Bilhah.", significance: "Tribe of Samson. Conspicuously absent from the list of sealed tribes in Revelation 7, possibly due to early adoption of idolatry (Judges 18).", events: [], refs: ["Genesis 49:16–17", "Judges 13–18"] }),
            N("naphtali", "Naphtali", "son", { era: "Twelve Tribes", date: "c. 1816 BC", role: "Tribe of Naphtali", summary: "Second son of Bilhah; settled in upper Galilee.", significance: "Like Zebulun, included in Isaiah 9 / Matthew 4 — the Galilean region of Jesus's public ministry.", events: [], refs: ["Genesis 49:21", "Isaiah 9:1–2"] }),
          ]),
          M("zilpah", "Zilpah", "handmaid", {
            era: "Twelve Tribes", date: "c. 1822 BC", role: "Leah's handmaid; mother of Gad & Asher",
            summary: "Maidservant given to Jacob by Leah after she stopped conceiving.",
            significance: "Her sons counted as Leah's legally; established two of the twelve tribes.",
            events: [], refs: ["Genesis 30:9–13"],
          }, [
            N("gad", "Gad", "son", { era: "Twelve Tribes", date: "c. 1820 BC", role: "Tribe of Gad", summary: "Eldest son of Zilpah.", significance: "Settled east of the Jordan; warriors known for their skill (1 Chronicles 12:8).", events: [], refs: ["Genesis 49:19", "Numbers 32"] }),
            N("asher", "Asher", "son", { era: "Twelve Tribes", date: "c. 1818 BC", role: "Tribe of Asher", summary: "Second son of Zilpah; settled along the Mediterranean coast.", significance: "Blessed with rich agricultural land. The prophetess Anna at Jesus's presentation in the Temple was of this tribe (Luke 2:36).", events: [], refs: ["Genesis 49:20", "Luke 2:36"] }),
          ]),
        ),
      ]),
    ),
  ]),
  M("hagar", "Hagar", "handmaid", {
    era: "Patriarchal Age", date: "c. 1990 BC", role: "Egyptian handmaid of Sarah; mother of Ishmael",
    summary: "Egyptian slave given to Abraham by Sarah to bear a child by surrogate. Sent into the wilderness twice; received divine promises about her son.",
    significance: "The first person in Scripture to give God a name (\"El Roi — the God who sees me\"). Paul reads her allegorically as the figure of slavery/law against Sarah's freedom/promise (Galatians 4).",
    events: ["Bore Ishmael as Sarah's surrogate (Genesis 16)", "Encountered God in the wilderness (Genesis 16)", "Sent away with Ishmael after Isaac's birth (Genesis 21)"],
    refs: ["Genesis 16, 21", "Galatians 4:21–31"],
  }, [
    N("ishmael", "Ishmael", "son", {
      era: "Patriarchal Age", date: "c. 1980 BC", role: "Father of 12 Arab tribes",
      summary: "Firstborn son of Abraham through Hagar, sent away after Isaac's birth. Promised to become a great nation.",
      significance: "Founder of the Ishmaelite tribes. Islamic tradition traces the Arab peoples and the Quraysh (Muhammad's tribe) through him.",
      events: ["Born to Hagar when Abraham was 86", "Circumcised at 13", "Sent into the wilderness with Hagar", "Fathered 12 princes / tribes (Genesis 25:12–18)"],
      refs: ["Genesis 16, 21, 25", "Galatians 4:21–31"],
    }),
  ]),
  M("keturah", "Keturah", "wife", {
    era: "Patriarchal Age", date: "c. 1860 BC", role: "Third wife of Abraham; mother of six sons",
    summary: "Married by Abraham after Sarah's death. Bore six sons who fathered Arabian and Midianite peoples east of Canaan.",
    significance: "Genesis 25 carefully separates her sons from the covenant line — Abraham sent them away \"to the country of the east\" so the inheritance could pass to Isaac alone. Among her descendants, the Midianites become significant: Moses's father-in-law Jethro is a Midianite priest, and Midianite traders carried Joseph to Egypt.",
    events: ["Married Abraham after Sarah's death (Genesis 25:1)", "Bore Zimran, Jokshan, Medan, Midian, Ishbak, and Shuah", "Her sons sent east with gifts, away from Isaac (Genesis 25:6)"],
    refs: ["Genesis 25:1–6", "1 Chronicles 1:32–33"],
  }, [
    N("zimran", "Zimran", "son", { era: "Patriarchal Age", date: "c. 1855 BC", role: "Son of Abraham and Keturah", summary: "Eldest son of Keturah. His descendants settled in Arabia.", significance: "Listed in 1 Chronicles 1:32 among the eastern peoples descended from Abraham.", events: [], refs: ["Genesis 25:2", "1 Chronicles 1:32"] }),
    N("jokshan", "Jokshan", "son", { era: "Patriarchal Age", date: "c. 1853 BC", role: "Father of Sheba and Dedan", summary: "Father of Sheba and Dedan, names that recur in prophetic oracles against Arabia.", significance: "Sheba and Dedan appear in Isaiah, Jeremiah, and Ezekiel as Arabian trading peoples.", events: [], refs: ["Genesis 25:2–3", "1 Chronicles 1:32"] }),
    N("medan", "Medan", "son", { era: "Patriarchal Age", date: "c. 1851 BC", role: "Son of Abraham and Keturah", summary: "Founded a tribe of the Arabian east.", significance: "Often listed alongside his brother Midian in references to caravan traders.", events: [], refs: ["Genesis 25:2"] }),
    N("midian", "Midian", "son", {
      pivot: true, era: "Patriarchal Age", date: "c. 1850 BC", role: "Father of the Midianites",
      summary: "Father of the Midianites — a significant Arabian people who recur throughout Israel's history.",
      significance: "Midianite traders carry the young Joseph to Egypt (Genesis 37). Moses flees to Midian, marries Zipporah daughter of the Midianite priest Jethro, and learns the geography that will guide the Exodus. The Midianites later become Israel's enemies under Gideon (Judges 6–8).",
      events: ["Founded the Midianite people"],
      refs: ["Genesis 25:2, 37:28", "Exodus 2:15 – 4:31", "Numbers 31", "Judges 6–8"],
    }),
    N("ishbak", "Ishbak", "son", { era: "Patriarchal Age", date: "c. 1849 BC", role: "Son of Abraham and Keturah", summary: "Founded a minor Arabian tribe.", significance: "Named only in genealogies.", events: [], refs: ["Genesis 25:2", "1 Chronicles 1:32"] }),
    N("shuah", "Shuah", "son", { era: "Patriarchal Age", date: "c. 1848 BC", role: "Son of Abraham and Keturah", summary: "Possibly the ancestor of Bildad the Shuhite — one of Job's three friends.", significance: "If the identification with Bildad's people holds, Keturah's descendants appear in the wisdom tradition through the book of Job.", events: [], refs: ["Genesis 25:2", "Job 2:11"] }),
  ]),
);

/* ============================================================
   CROSS-LINKS — DAG edges drawn over the tree layout
   ============================================================ */

const crossLinks: CrossLink[] = [
  {
    fromId: "heli",
    toId: "mary",
    variant: "lukan-descent",
    label: "Luke 3:23 — Mary, daughter of Heli",
  },
];

/* ============================================================
   FLATTEN — id lookup for the detail panel and expand-all
   ============================================================ */

const allNodes: Record<string, PersonNode> = (() => {
  const map: Record<string, PersonNode> = {};
  const walk = (n: PersonNode): void => {
    map[n.id] = n;
    n.children?.forEach(walk);
    n.spouses?.forEach((s) => {
      map[s.person.id] = s.person;
      s.children.forEach(walk);
    });
  };
  walk(data);
  return map;
})();

const expandableIds: string[] = (() => {
  const ids: string[] = [];
  const walk = (n: PersonNode): void => {
    const hasKids = !!(n.children?.length || n.spouses?.length);
    if (hasKids) ids.push(n.id);
    n.children?.forEach(walk);
    n.spouses?.forEach((s) => {
      // a spouse herself is expandable iff she has children
      if (s.children.length) ids.push(s.person.id);
      s.children.forEach(walk);
    });
  };
  walk(data);
  return ids;
})();

function nodeHasOwnDescendants(node: PersonNode): boolean {
  return !!(node.children?.length || node.spouses?.length);
}

function spouseChildrenById(): Record<string, PersonNode[]> {
  const map: Record<string, PersonNode[]> = {};
  const walk = (n: PersonNode): void => {
    n.spouses?.forEach((s) => {
      map[s.person.id] = s.children;
      s.children.forEach(walk);
    });
    n.children?.forEach(walk);
  };
  walk(data);
  return map;
}
const spouseKidMap = spouseChildrenById();

function expandableForId(id: string): boolean {
  const node = allNodes[id];
  if (!node) return false;
  if (node.type === "mother") return (spouseKidMap[id]?.length ?? 0) > 0;
  return nodeHasOwnDescendants(node);
}

/* ============================================================
   LAYOUT — orientation-agnostic; we compute (depth, span)
   ============================================================ */

function spanOfChildren(children: PersonNode[], expanded: Set<string>): number {
  return children.reduce((sum, c) => sum + computeSpan(c, expanded), 0);
}

function computeSpan(node: PersonNode, expanded: Set<string>): number {
  if (!expanded.has(node.id)) return 1;
  const fromSpouses =
    node.spouses?.reduce(
      (sum, s) => sum + Math.max(1, spanOfChildren(s.children, expanded)),
      0
    ) ?? 0;
  const fromChildren = node.children ? spanOfChildren(node.children, expanded) : 0;
  return Math.max(1, fromSpouses + fromChildren);
}

function layout(
  node: PersonNode,
  depth: number,
  top: number,
  expanded: Set<string>,
  positions: LayoutPosition[],
  parentForSpouseId?: string
): void {
  const span = computeSpan(node, expanded);
  positions.push({
    id: node.id,
    node,
    depth,
    span: top + span / 2,
    isSpouse: !!parentForSpouseId,
    parentId: parentForSpouseId,
  });

  if (!expanded.has(node.id)) return;

  let bandTop = top;

  for (const sp of node.spouses ?? []) {
    const childSpan = spanOfChildren(sp.children, expanded);
    const bandSize = Math.max(1, childSpan);
    positions.push({
      id: sp.person.id,
      node: sp.person,
      depth,
      span: bandTop + bandSize / 2,
      isSpouse: true,
      parentId: node.id,
      spouseStatus: sp.status,
    });
    let childTop = bandTop;
    for (const c of sp.children) {
      layout(c, depth + 1, childTop, expanded, positions);
      childTop += computeSpan(c, expanded);
    }
    bandTop += bandSize;
  }

  for (const c of node.children ?? []) {
    layout(c, depth + 1, bandTop, expanded, positions);
    bandTop += computeSpan(c, expanded);
  }
}

function buildConnections(
  positions: LayoutPosition[],
  expanded: Set<string>
): Connection[] {
  const byId = new Map(positions.map((p) => [p.id, p]));
  const out: Connection[] = [];

  // Marriage edges
  for (const p of positions) {
    if (!p.isSpouse || !p.parentId) continue;
    const father = byId.get(p.parentId);
    if (father) {
      out.push({
        fromId: father.id,
        toId: p.id,
        from: father,
        to: p,
        kind: "marriage",
        spouseStatus: p.spouseStatus,
      });
    }
  }

  // Descent edges via tree walk
  const walk = (node: PersonNode): void => {
    if (!expanded.has(node.id)) return;
    for (const sp of node.spouses ?? []) {
      const motherPos = byId.get(sp.person.id);
      for (const c of sp.children) {
        const childPos = byId.get(c.id);
        if (motherPos && childPos) {
          out.push({
            fromId: motherPos.id,
            toId: childPos.id,
            from: motherPos,
            to: childPos,
            kind: "descent",
          });
        }
        walk(c);
      }
    }
    for (const c of node.children ?? []) {
      const fatherPos = byId.get(node.id);
      const childPos = byId.get(c.id);
      if (fatherPos && childPos) {
        out.push({
          fromId: fatherPos.id,
          toId: childPos.id,
          from: fatherPos,
          to: childPos,
          kind: "descent",
        });
      }
      walk(c);
    }
  };
  walk(data);

  // Cross-links — only when both endpoints are present
  for (const cl of crossLinks) {
    const from = byId.get(cl.fromId);
    const to = byId.get(cl.toId);
    if (from && to) {
      out.push({ fromId: cl.fromId, toId: cl.toId, from, to, kind: "cross" });
    }
  }

  return out;
}

/* ============================================================
   DESIGN TOKENS
   ============================================================ */
const FONT = '"Google Sans Flex", "Google Sans", var(--font-sans), system-ui, -apple-system, sans-serif';
const C = {
  bg: "#0f0d0a",
  surface: "#1a1612",
  surfaceMother: "#161310",
  surfaceGhost: "#141110",
  surfaceHover: "#241f18",
  border: "#3a302a",
  borderGhost: "#2a231e",
  borderPivot: "#8b6f47",
  borderSelected: "#d4a574",
  line: "#3a302a",
  lineMarriage: "#5a4a3a",
  lineHandmaid: "#48392f",
  lineIrregular: "#6b5340",
  lineCross: "#7a5a3a",
  text: "#f5efe4",
  textMother: "#cdbea3",
  textGhost: "#7a6e60",
  textMuted: "#a89e90",
  textFaint: "#6b6258",
  accent: "#d4a574",
  accentDeep: "#b8884d",
  panelBg: "#16120e",
} as const;

/* ============================================================
   GEOMETRY — node sizes & axis projection
   ============================================================ */

const D_UNIT = 220; // generation axis spacing
const S_UNIT = 70;  // sibling axis spacing

function getNodeSize(node: PersonNode): { w: number; h: number } {
  if (node.type === "mother") return { w: 130, h: 38 };
  if (node.pivot) return { w: 168, h: 50 };
  if (node.id === "lukan-stub") return { w: 220, h: 44 };
  return { w: 156, h: 44 };
}

function project(p: LayoutPosition, orientation: Orientation): { x: number; y: number } {
  return orientation === "horizontal"
    ? { x: p.depth * D_UNIT, y: p.span * S_UNIT }
    : { x: p.span * S_UNIT, y: p.depth * D_UNIT };
}

/* ============================================================
   NODE
   ============================================================ */

interface NodeShapeProps {
  position: LayoutPosition;
  orientation: Orientation;
  isExpanded: boolean;
  hasChildren: boolean;
  isSelected: boolean;
  onClick: () => void;
}

function NodeShape({ position, orientation, isExpanded, hasChildren, isSelected, onClick }: NodeShapeProps) {
  const { node } = position;
  const { x, y } = project(position, orientation);
  const { w, h } = getNodeSize(node);
  const isMother = node.type === "mother";
  const isPivot = !!node.pivot;
  const isGhost = !!node.ghost;

  const fill = isSelected ? C.surfaceHover : isGhost ? C.surfaceGhost : isMother ? C.surfaceMother : C.surface;
  const stroke = isSelected ? C.borderSelected : isPivot ? C.borderPivot : isGhost ? C.borderGhost : C.border;
  const strokeWidth = isSelected ? 2 : 1;
  const strokeDash = isGhost ? "3 3" : undefined;
  const rx = isMother ? 19 : node.id === "lukan-stub" ? 14 : 6;
  const opacity = isGhost ? 0.7 : 1;

  return (
    <g
      transform={`translate(${x},${y})`}
      style={{ cursor: "pointer", transition: "transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)", opacity }}
      onClick={onClick}
      className="node-fade-in"
    >
      <rect
        x={-w / 2}
        y={-h / 2}
        width={w}
        height={h}
        rx={rx}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeDasharray={strokeDash}
        style={{ transition: "fill 0.2s, stroke 0.2s, stroke-width 0.2s" }}
      />
      {isPivot && !isMother && <circle cx={-w / 2 + 12} cy={0} r={3} fill={C.accent} />}
      <text
        x={isPivot && !isMother ? -w / 2 + 22 : 0}
        y={0}
        textAnchor={isPivot && !isMother ? "start" : "middle"}
        dominantBaseline="middle"
        fill={isGhost ? C.textGhost : isMother ? C.textMother : C.text}
        fontSize={isMother ? 13 : isPivot ? 15 : node.id === "lukan-stub" ? 12 : 14}
        fontWeight={isPivot ? 500 : 450}
        fontStyle={isMother || isGhost || node.id === "lukan-stub" ? "italic" : "normal"}
        fontFamily={FONT}
        letterSpacing={isPivot ? "-0.01em" : "normal"}
        style={{ pointerEvents: "none", userSelect: "none" }}
      >
        {node.name}
      </text>
      {hasChildren && (
        <g
          transform={
            orientation === "horizontal"
              ? `translate(${w / 2 - 14}, 0)`
              : `translate(0, ${h / 2 - 14})`
          }
          style={{ pointerEvents: "none" }}
        >
          <circle r={8} fill={isExpanded ? C.accent : "transparent"} stroke={isExpanded ? C.accent : C.border} strokeWidth={1} />
          <text
            textAnchor="middle"
            dominantBaseline="middle"
            fill={isExpanded ? C.bg : C.textMuted}
            fontSize={isExpanded ? 14 : 12}
            fontWeight={500}
            style={{ userSelect: "none" }}
          >
            {isExpanded ? "−" : "+"}
          </text>
        </g>
      )}
    </g>
  );
}

/* ============================================================
   CONNECTION
   ============================================================ */

function descentPath(
  from: { x: number; y: number; w: number; h: number },
  to: { x: number; y: number; w: number; h: number },
  orientation: Orientation
): string {
  if (orientation === "horizontal") {
    const x1 = from.x + from.w / 2;
    const y1 = from.y;
    const x2 = to.x - to.w / 2;
    const y2 = to.y;
    const midX = (x1 + x2) / 2;
    return `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`;
  }
  const x1 = from.x;
  const y1 = from.y + from.h / 2;
  const x2 = to.x;
  const y2 = to.y - to.h / 2;
  const midY = (y1 + y2) / 2;
  return `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;
}

function marriagePath(
  from: { x: number; y: number; w: number; h: number },
  to: { x: number; y: number; w: number; h: number },
  orientation: Orientation
): string {
  if (orientation === "horizontal") {
    // Same x; spouse is above or below the father
    const direction = to.y > from.y ? 1 : -1;
    const y1 = from.y + (direction * from.h) / 2;
    const y2 = to.y - (direction * to.h) / 2;
    return `M ${from.x} ${y1} L ${to.x} ${y2}`;
  }
  // Same y; spouse is left or right of the father
  const direction = to.x > from.x ? 1 : -1;
  const x1 = from.x + (direction * from.w) / 2;
  const x2 = to.x - (direction * to.w) / 2;
  return `M ${x1} ${from.y} L ${x2} ${to.y}`;
}

function crossLinkPath(
  from: { x: number; y: number },
  to: { x: number; y: number },
  orientation: Orientation
): string {
  // Free-form S-curve between far-apart endpoints
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  if (orientation === "horizontal") {
    // bias the curve outward in y so it doesn't overlap the Matthean column
    const c1x = from.x + dx * 0.25;
    const c1y = from.y + dy * 0.05;
    const c2x = from.x + dx * 0.75;
    const c2y = to.y - dy * 0.05;
    return `M ${from.x} ${from.y} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${to.x} ${to.y}`;
  }
  const c1x = from.x + dx * 0.05;
  const c1y = from.y + dy * 0.25;
  const c2x = to.x - dx * 0.05;
  const c2y = from.y + dy * 0.75;
  return `M ${from.x} ${from.y} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${to.x} ${to.y}`;
}

function ConnectionPath({ conn, orientation }: { conn: Connection; orientation: Orientation }) {
  const f = project(conn.from, orientation);
  const t = project(conn.to, orientation);
  const fromSize = getNodeSize(conn.from.node);
  const toSize = getNodeSize(conn.to.node);
  const from = { ...f, ...fromSize };
  const to = { ...t, ...toSize };

  if (conn.kind === "marriage") {
    const stroke =
      conn.spouseStatus === "handmaid"
        ? C.lineHandmaid
        : conn.spouseStatus === "irregular"
        ? C.lineIrregular
        : C.lineMarriage;
    const dash =
      conn.spouseStatus === "handmaid"
        ? "2 3"
        : conn.spouseStatus === "irregular"
        ? "1 3"
        : "4 3";
    return (
      <path
        d={marriagePath(from, to, orientation)}
        fill="none"
        stroke={stroke}
        strokeWidth={1.2}
        strokeDasharray={dash}
        opacity={0.75}
        className="connection-fade-in"
      />
    );
  }

  if (conn.kind === "cross") {
    return (
      <path
        d={crossLinkPath(f, t, orientation)}
        fill="none"
        stroke={C.lineCross}
        strokeWidth={1.2}
        strokeDasharray="2 4"
        opacity={0.55}
        className="connection-fade-in"
      />
    );
  }

  return (
    <path
      d={descentPath(from, to, orientation)}
      fill="none"
      stroke={C.line}
      strokeWidth={1.2}
      opacity={0.7}
      className="connection-fade-in"
    />
  );
}

/* ============================================================
   RESPONSIVE — viewport hook
   ============================================================ */

const MOBILE_BREAKPOINT = 768;

function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return isMobile;
}

/* ============================================================
   DETAIL PANEL
   ============================================================ */

interface DetailPanelProps {
  node: PersonNode | null;
  onClose: () => void;
  isMobile: boolean;
}

function DetailSection({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section style={{ marginBottom: 24 }}>
      <div className="flex items-center" style={{ gap: 8, marginBottom: 10 }}>
        {icon}
        <span
          style={{
            color: C.accent,
            fontSize: 11,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            fontWeight: 500,
          }}
        >
          {label}
        </span>
      </div>
      {children}
    </section>
  );
}

function DetailPanel({ node, onClose, isMobile }: DetailPanelProps) {
  if (!node) return null;
  const isPivot = !!node.pivot;
  const isGhost = !!node.ghost;

  const containerStyle: React.CSSProperties = isMobile
    ? {
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        maxHeight: "82vh",
        background: C.panelBg,
        borderTop: `1px solid ${C.border}`,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        fontFamily: FONT,
        animation: "slideUp 0.32s cubic-bezier(0.2, 0.8, 0.2, 1)",
        zIndex: 30,
        boxShadow: "0 -10px 40px rgba(0,0,0,0.55)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }
    : {
        width: 420,
        background: C.panelBg,
        borderLeft: `1px solid ${C.border}`,
        fontFamily: FONT,
        animation: "slideInRight 0.35s cubic-bezier(0.2, 0.8, 0.2, 1)",
      };

  const headerPad = isMobile ? "16px 18px 14px" : "24px 28px 18px";
  const bodyPad = isMobile ? "16px 18px 28px" : "22px 28px 32px";
  const titleSize = isMobile ? 24 : 30;

  return (
    <>
      {isMobile && (
        <div
          onClick={onClose}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            zIndex: 25,
            animation: "fadeIn 0.25s ease-out",
          }}
        />
      )}
      <div
        className={`flex flex-col overflow-hidden${isMobile ? "" : " h-full"}`}
        style={containerStyle}
        role="dialog"
        aria-label={`Details for ${node.name}`}
      >
        {isMobile && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              padding: "8px 0 0",
            }}
            aria-hidden
          >
            <span
              style={{
                width: 36,
                height: 4,
                borderRadius: 2,
                background: C.border,
              }}
            />
          </div>
        )}
        <div style={{ padding: headerPad, borderBottom: `1px solid ${C.border}` }}>
          <div className="flex items-start justify-between" style={{ marginBottom: 12, gap: 12 }}>
            <div
              style={{
                color: C.accent,
                fontSize: 11,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                fontWeight: 500,
              }}
            >
              {node.era}
              {node.date && ` · ${node.date}`}
              {isGhost && " · skipped by Matthew"}
            </div>
            <button
              onClick={onClose}
              style={{
                color: C.textMuted,
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: 8,
                marginRight: -8,
                marginTop: -8,
                touchAction: "manipulation",
              }}
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>
          <h2
            style={{
              color: C.text,
              fontSize: titleSize,
              fontWeight: 450,
              letterSpacing: "-0.02em",
              lineHeight: 1.06,
              marginBottom: 6,
            }}
          >
            {node.name}
          </h2>
          {node.role && (
            <div
              style={{
                color: isPivot ? C.accent : C.textMuted,
                fontSize: 14,
                fontWeight: 450,
                fontStyle: node.type === "mother" ? "italic" : "normal",
              }}
            >
              {node.role}
            </div>
          )}
        </div>

        <div
          className="flex-1 overflow-y-auto"
          style={{ padding: bodyPad, WebkitOverflowScrolling: "touch", overscrollBehavior: "contain" }}
        >
          {node.summary && (
            <p style={{ color: C.text, fontSize: 15, lineHeight: 1.55, marginBottom: 24 }}>
              {node.summary}
            </p>
          )}

          {node.significance && (
            <DetailSection icon={<Sparkles size={13} style={{ color: C.accent }} />} label="Why this matters">
              <p style={{ color: C.text, fontSize: 14, lineHeight: 1.6 }}>{node.significance}</p>
            </DetailSection>
          )}

          {node.events && node.events.length > 0 && (
            <DetailSection icon={<Calendar size={13} style={{ color: C.accent }} />} label="Key events">
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {node.events.map((e, i) => (
                  <li
                    key={i}
                    style={{
                      color: C.text,
                      fontSize: 13.5,
                      lineHeight: 1.55,
                      paddingLeft: 16,
                      position: "relative",
                      marginBottom: 8,
                    }}
                  >
                    <span
                      style={{
                        position: "absolute",
                        left: 0,
                        top: 9,
                        width: 6,
                        height: 1,
                        background: C.accentDeep,
                      }}
                    />
                    {e}
                  </li>
                ))}
              </ul>
            </DetailSection>
          )}

          {node.refs && node.refs.length > 0 && (
            <DetailSection icon={<BookOpen size={13} style={{ color: C.accent }} />} label="Scripture">
              <div style={{ color: C.textMuted, fontSize: 13, fontStyle: "italic", lineHeight: 1.6 }}>
                {node.refs.join(" · ")}
              </div>
            </DetailSection>
          )}
        </div>
      </div>
    </>
  );
}

/* ============================================================
   ORIENTATION TOGGLE ICON (inline SVG; lucide-react v1.14 lacks
   a stable rotation icon, so we draw our own.)
   ============================================================ */

function OrientationIcon({ orientation }: { orientation: Orientation }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      {orientation === "horizontal" ? (
        // horizontal arrows
        <>
          <line x1="2" y1="7" x2="12" y2="7" />
          <polyline points="9 4 12 7 9 10" />
          <polyline points="5 4 2 7 5 10" />
        </>
      ) : (
        // vertical arrows
        <>
          <line x1="7" y1="2" x2="7" y2="12" />
          <polyline points="4 9 7 12 10 9" />
          <polyline points="4 5 7 2 10 5" />
        </>
      )}
    </svg>
  );
}

/* ============================================================
   MAIN COMPONENT
   ============================================================ */

const STORAGE_KEY = "abraham-orientation";

function readStoredOrientation(): Orientation {
  if (typeof window === "undefined") return "horizontal";
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved === "vertical" ? "vertical" : "horizontal";
  } catch {
    return "horizontal";
  }
}

export default function Genealogy() {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [orientation, setOrientation] = useState<Orientation>(readStoredOrientation);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const gRef = useRef<SVGGElement | null>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const isMobile = useIsMobile();

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, orientation);
    } catch {
      /* ignore */
    }
  }, [orientation]);

  // d3 zoom setup
  useEffect(() => {
    if (!svgRef.current) return;
    const svgEl = svgRef.current;
    const svg = d3.select<SVGSVGElement, unknown>(svgEl);
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.15, 3])
      .on("zoom", (event) => {
        if (gRef.current) {
          gRef.current.setAttribute(
            "transform",
            `translate(${event.transform.x},${event.transform.y}) scale(${event.transform.k})`
          );
        }
        setZoomLevel(event.transform.k);
      });
    svg.call(zoom);
    zoomRef.current = zoom;

    return () => {
      svg.on(".zoom", null);
    };
  }, []);

  const positions = useMemo(
    () => {
      const out: LayoutPosition[] = [];
      layout(data, 0, 0, expandedIds, out);
      return out;
    },
    [expandedIds]
  );
  const connections = useMemo(
    () => buildConnections(positions, expandedIds),
    [positions, expandedIds]
  );
  const selectedNode = selectedId ? allNodes[selectedId] ?? null : null;

  const recenter = useCallback(
    (animated = true) => {
      if (!svgRef.current || !zoomRef.current || positions.length === 0) return;
      const projected = positions.map((p) => project(p, orientation));
      const xs = projected.map((p) => p.x);
      const ys = projected.map((p) => p.y);
      const padX = 120;
      const padY = 80;
      const minX = Math.min(...xs) - padX;
      const maxX = Math.max(...xs) + padX;
      const minY = Math.min(...ys) - padY;
      const maxY = Math.max(...ys) + padY;
      const cw = Math.max(1, maxX - minX);
      const ch = Math.max(1, maxY - minY);
      const sw = svgRef.current.clientWidth;
      const sh = svgRef.current.clientHeight;
      const k = Math.min(sw / cw, sh / ch, 1);
      const tx = sw / 2 - (minX + cw / 2) * k;
      const ty = sh / 2 - (minY + ch / 2) * k;
      const sel = d3.select<SVGSVGElement, unknown>(svgRef.current);
      const target = d3.zoomIdentity.translate(tx, ty).scale(k);
      if (animated) sel.transition().duration(450).call(zoomRef.current.transform, target);
      else sel.call(zoomRef.current.transform, target);
    },
    [positions, orientation]
  );

  // Initial centering and re-center on orientation flip / mobile-breakpoint change
  useEffect(() => {
    recenter(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orientation, isMobile]);

  // Re-fit when the viewport itself resizes (rotation, browser resize, soft-keyboard close)
  useEffect(() => {
    let raf = 0;
    const onResize = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => recenter(false));
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
    };
  }, [recenter]);

  const handleNodeClick = (node: PersonNode): void => {
    if (expandableForId(node.id)) {
      const next = new Set(expandedIds);
      if (next.has(node.id)) next.delete(node.id);
      else next.add(node.id);
      setExpandedIds(next);
    }
    setSelectedId(node.id);
  };

  const expandAll = (): void => setExpandedIds(new Set(expandableIds));

  const reset = (): void => {
    setExpandedIds(new Set());
    setSelectedId(null);
    if (svgRef.current && zoomRef.current) {
      const svg = d3.select<SVGSVGElement, unknown>(svgRef.current);
      const w = svgRef.current.clientWidth;
      const h = svgRef.current.clientHeight;
      svg
        .transition()
        .duration(500)
        .call(
          zoomRef.current.transform,
          orientation === "horizontal"
            ? d3.zoomIdentity.translate(w / 2 - 80, h / 2)
            : d3.zoomIdentity.translate(w / 2, h / 2 - 80)
        );
    }
  };

  const zoomBy = (factor: number): void => {
    if (svgRef.current && zoomRef.current) {
      d3.select<SVGSVGElement, unknown>(svgRef.current)
        .transition()
        .duration(200)
        .call(zoomRef.current.scaleBy, factor);
    }
  };

  const toggleOrientation = (): void => {
    setOrientation((o) => (o === "horizontal" ? "vertical" : "horizontal"));
  };

  const btnStyle: React.CSSProperties = {
    color: C.textMuted,
    background: "transparent",
    border: `1px solid ${C.border}`,
    borderRadius: 6,
    padding: isMobile ? "8px 10px" : "7px 12px",
    fontSize: isMobile ? 11 : 12,
    fontFamily: FONT,
    cursor: "pointer",
    letterSpacing: "0.02em",
    touchAction: "manipulation",
  };

  const iconBtnStyle: React.CSSProperties = {
    ...btnStyle,
    padding: isMobile ? "8px 9px" : "7px 9px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  const orientationBtnStyle: React.CSSProperties = {
    ...btnStyle,
    display: "flex",
    alignItems: "center",
    gap: 7,
  };

  return (
    <div
      className="flex w-full"
      style={{
        height: "100dvh",
        background: C.bg,
        fontFamily: FONT,
        overflow: "hidden",
      }}
    >
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideInRight { from { transform: translateX(20px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(28px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .node-fade-in { animation: fadeIn 0.35s ease-out; }
        .connection-fade-in { animation: fadeIn 0.5s ease-out; }
        .tool-btn { transition: all 0.15s ease-out; }
        .tool-btn:hover { background: ${C.surfaceHover} !important; color: ${C.text} !important; border-color: ${C.borderPivot} !important; }
        .tool-btn:active { transform: scale(0.96); }
        .gen-svg { touch-action: none; -webkit-user-select: none; user-select: none; }
      `}</style>

      <div className="flex-1 flex flex-col" style={{ minWidth: 0, position: "relative" }}>
        <header
          className="flex items-center justify-between"
          style={{
            padding: isMobile ? "10px 14px" : "16px 24px",
            borderBottom: `1px solid ${C.border}`,
            background: C.bg,
            zIndex: 10,
            gap: 8,
            paddingTop: isMobile ? "calc(10px + env(safe-area-inset-top))" : "16px",
          }}
        >
          <div style={{ minWidth: 0, flex: "0 1 auto" }}>
            <h1
              style={{
                color: C.text,
                fontSize: isMobile ? 16 : 20,
                fontWeight: 500,
                letterSpacing: "-0.018em",
                lineHeight: 1.1,
                whiteSpace: "nowrap",
              }}
            >
              Abraham to Jesus
            </h1>
            {!isMobile && (
              <div style={{ color: C.textFaint, fontSize: 11, letterSpacing: "0.06em", marginTop: 3 }}>
                click a node to expand · scroll to zoom · drag to pan
              </div>
            )}
          </div>

          <div className="flex items-center" style={{ gap: isMobile ? 4 : 8, flexShrink: 0 }}>
            <button onClick={toggleOrientation} className="tool-btn" style={orientationBtnStyle} title="Toggle layout orientation" aria-label="Toggle layout orientation">
              <OrientationIcon orientation={orientation} />
              {!isMobile && <span>{orientation === "horizontal" ? "Horizontal" : "Vertical"}</span>}
            </button>
            {!isMobile && <div style={{ width: 1, height: 24, background: C.border, margin: "0 4px" }} />}
            <button onClick={expandAll} className="tool-btn" style={btnStyle} title="Expand all">
              {isMobile ? "All" : "Expand all"}
            </button>
            <button onClick={reset} className="tool-btn" style={btnStyle} title="Reset">
              Reset
            </button>
            {!isMobile && <div style={{ width: 1, height: 24, background: C.border, margin: "0 4px" }} />}
            {!isMobile && (
              <button onClick={() => zoomBy(0.7)} className="tool-btn" style={iconBtnStyle} title="Zoom out" aria-label="Zoom out">
                <ZoomOut size={15} />
              </button>
            )}
            {!isMobile && (
              <button onClick={() => zoomBy(1.4)} className="tool-btn" style={iconBtnStyle} title="Zoom in" aria-label="Zoom in">
                <ZoomIn size={15} />
              </button>
            )}
            <button onClick={() => recenter(true)} className="tool-btn" style={iconBtnStyle} title="Fit to screen" aria-label="Fit to screen">
              <Maximize2 size={14} />
            </button>
            {!isMobile && (
              <div
                style={{
                  color: C.textFaint,
                  fontSize: 11,
                  fontVariantNumeric: "tabular-nums",
                  minWidth: 36,
                  textAlign: "right",
                }}
              >
                {Math.round(zoomLevel * 100)}%
              </div>
            )}
          </div>
        </header>

        <div className="flex-1" style={{ position: "relative", overflow: "hidden" }}>
          <svg
            ref={svgRef}
            width="100%"
            height="100%"
            className="gen-svg"
            style={{ display: "block", cursor: "grab" }}
          >
            <g ref={gRef}>
              {connections.map((c) => (
                <ConnectionPath key={`${c.kind}-${c.fromId}-${c.toId}`} conn={c} orientation={orientation} />
              ))}
              {positions.map((p) => (
                <NodeShape
                  key={p.id}
                  position={p}
                  orientation={orientation}
                  isExpanded={expandedIds.has(p.id)}
                  hasChildren={expandableForId(p.id)}
                  isSelected={selectedId === p.id}
                  onClick={() => handleNodeClick(p.node)}
                />
              ))}
            </g>
          </svg>

          {isMobile && (
            <div
              style={{
                position: "absolute",
                top: 8,
                right: 8,
                color: C.textFaint,
                fontSize: 10,
                fontVariantNumeric: "tabular-nums",
                padding: "3px 8px",
                background: "rgba(15,13,10,0.7)",
                border: `1px solid ${C.border}`,
                borderRadius: 999,
                pointerEvents: "none",
              }}
            >
              {Math.round(zoomLevel * 100)}%
            </div>
          )}

          {expandedIds.size === 0 && !selectedId && (
            <div
              style={{
                position: "absolute",
                bottom: isMobile ? 16 : 32,
                left: "50%",
                transform: "translateX(-50%)",
                color: C.textFaint,
                fontSize: isMobile ? 11 : 12,
                letterSpacing: "0.04em",
                padding: isMobile ? "8px 14px" : "10px 18px",
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                pointerEvents: "none",
                animation: "fadeIn 0.6s ease-out",
                whiteSpace: isMobile ? "nowrap" : "normal",
                maxWidth: "calc(100% - 24px)",
                textAlign: "center",
              }}
            >
              {isMobile ? (
                <>
                  Tap <span style={{ color: C.accent }}>Abraham</span> · pinch to zoom
                </>
              ) : (
                <>
                  Click <span style={{ color: C.accent }}>Abraham</span> to begin · or{" "}
                  <span style={{ color: C.accent }}>Expand all</span> to see the full lineage
                </>
              )}
            </div>
          )}
        </div>

        {!isMobile && (
          <footer
            className="flex items-center justify-between"
            style={{
              padding: "10px 24px",
              borderTop: `1px solid ${C.border}`,
              background: C.bg,
              zIndex: 10,
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <div className="flex items-center" style={{ gap: 18, flexWrap: "wrap" }}>
              <div className="flex items-center" style={{ gap: 7 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.accent }} />
                <span style={{ color: C.textMuted, fontSize: 11, letterSpacing: "0.04em" }}>pivot moment</span>
              </div>
              <div className="flex items-center" style={{ gap: 7 }}>
                <span
                  style={{
                    width: 22,
                    height: 12,
                    borderRadius: 6,
                    background: C.surfaceMother,
                    border: `1px solid ${C.border}`,
                  }}
                />
                <span style={{ color: C.textMuted, fontSize: 11, letterSpacing: "0.04em" }}>matriarch</span>
              </div>
              <div className="flex items-center" style={{ gap: 7 }}>
                <svg width="22" height="6">
                  <line x1="0" y1="3" x2="22" y2="3" stroke={C.lineMarriage} strokeDasharray="4 3" strokeWidth="1.2" />
                </svg>
                <span style={{ color: C.textMuted, fontSize: 11, letterSpacing: "0.04em" }}>marriage</span>
              </div>
              <div className="flex items-center" style={{ gap: 7 }}>
                <svg width="22" height="6">
                  <line x1="0" y1="3" x2="22" y2="3" stroke={C.lineHandmaid} strokeDasharray="2 3" strokeWidth="1.2" />
                </svg>
                <span style={{ color: C.textMuted, fontSize: 11, letterSpacing: "0.04em" }}>handmaid / surrogate</span>
              </div>
              <div className="flex items-center" style={{ gap: 7 }}>
                <span
                  style={{
                    width: 22,
                    height: 12,
                    borderRadius: 6,
                    background: C.surfaceGhost,
                    border: `1px dashed ${C.borderGhost}`,
                    opacity: 0.7,
                  }}
                />
                <span style={{ color: C.textMuted, fontSize: 11, letterSpacing: "0.04em" }}>skipped by Matthew</span>
              </div>
              <div className="flex items-center" style={{ gap: 7 }}>
                <svg width="22" height="6">
                  <line x1="0" y1="3" x2="22" y2="3" stroke={C.lineCross} strokeDasharray="2 4" strokeWidth="1.2" />
                </svg>
                <span style={{ color: C.textMuted, fontSize: 11, letterSpacing: "0.04em" }}>Lukan cross-link</span>
              </div>
            </div>
            <div style={{ color: C.textFaint, fontSize: 11, letterSpacing: "0.04em" }}>
              sources: Genesis · Ruth · 1–2 Kings · 1–2 Chronicles · Matthew 1 · Luke 3
            </div>
          </footer>
        )}
      </div>

      {selectedNode && (
        <DetailPanel node={selectedNode} onClose={() => setSelectedId(null)} isMobile={isMobile} />
      )}
    </div>
  );
}
