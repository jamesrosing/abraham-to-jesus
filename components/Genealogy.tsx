"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import * as d3 from "d3";
import { X, ZoomIn, ZoomOut, Maximize2, BookOpen, Calendar, Sparkles } from "lucide-react";

/* ============================================================
   TYPES
   ============================================================ */

type NodeType = "patriarch" | "king" | "son" | "mother";

interface PersonNode {
  id: string;
  name: string;
  type: NodeType;
  pivot?: boolean;
  era?: string;
  date?: string;
  role?: string;
  summary?: string;
  significance?: string;
  events?: string[];
  refs?: string[];
  children?: PersonNode[];
}

interface NodeInfo extends Omit<PersonNode, "id" | "name" | "type" | "children"> {}

interface LayoutPosition {
  id: string;
  node: PersonNode;
  x: number;
  y: number;
}

interface Connection {
  fromId: string;
  toId: string;
  from: LayoutPosition;
  to: LayoutPosition;
  isMarriage: boolean;
}

/* ============================================================
   GENEALOGY DATA
   ============================================================ */

const N = (
  id: string,
  name: string,
  type: NodeType,
  info: NodeInfo,
  children: PersonNode[] = []
): PersonNode => ({ id, name, type, ...info, children });

const data: PersonNode = N("abraham", "Abraham", "patriarch", {
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
}, [
  N("sarah", "Sarah", "mother", {
    era: "Patriarchal Age", date: "c. 1990 BC", role: "Wife of Abraham; mother of Isaac",
    summary: "Wife of Abraham, originally Sarai. Bore Isaac at 90 after decades of barrenness.",
    significance: "The matriarch through whom the covenant line flows. Paul reads Sarah as the figure of promise/freedom against Hagar (Galatians 4).",
    events: ["Renamed Sarah (\"princess\") at 89 (Genesis 17)", "Bore Isaac at 90 (Genesis 21)", "Died at 127, buried in the cave of Machpelah (Genesis 23)"],
    refs: ["Genesis 11–23", "Hebrews 11:11", "1 Peter 3:6"],
  }, [
    N("isaac", "Isaac", "patriarch", {
      pivot: true, era: "Patriarchal Age", date: "c. 1900 BC", role: "Child of promise",
      summary: "Born to Sarah in her old age as the fulfillment of God's promise. The covenant passes through him rather than the elder Ishmael.",
      significance: "Second of the three patriarchs. The \"binding of Isaac\" (Akedah) becomes a typological prefigurement of sacrificial substitution.",
      events: ["Born to a 90-year-old Sarah (Genesis 21)", "Bound on Mount Moriah, spared by the ram (Genesis 22)", "Married Rebekah (Genesis 24)", "Father of twins Esau and Jacob (Genesis 25)"],
      refs: ["Genesis 21–28", "Hebrews 11:17–20"],
    }, [
      N("rebekah", "Rebekah", "mother", {
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
        N("jacob", "Jacob", "patriarch", {
          pivot: true, era: "Patriarchal Age", date: "c. 1850 BC", role: "Father of the Twelve Tribes; renamed Israel",
          summary: "Younger twin who supplanted Esau, wrestled with God at Peniel, and was renamed Israel. His twelve sons by four women became the twelve tribes.",
          significance: "The nation Israel is named for him. The tribal structure and territorial allotments after the conquest flow from his sons. His migration to Egypt sets up the Exodus.",
          events: ["Bought the birthright; stole the blessing (Genesis 25, 27)", "Vision of the ladder at Bethel (Genesis 28)", "Served Laban 14 years for Leah and Rachel", "Wrestled the angel; renamed Israel (Genesis 32)", "Family migrates to Egypt during famine (Genesis 46)"],
          refs: ["Genesis 25–50", "Hosea 12"],
        }, [
          N("leah", "Leah", "mother", {
            era: "Twelve Tribes", date: "c. 1830 BC", role: "First wife of Jacob; mother of six tribes",
            summary: "Older daughter of Laban, given to Jacob through Laban's deception. Bore six sons including Levi (priestly) and Judah (royal/messianic).",
            significance: "Mother of more tribes than any other woman, including the two most theologically significant: Levi and Judah.",
            events: ["Married to Jacob through Laban's switch (Genesis 29)", "Bore Reuben, Simeon, Levi, Judah, Issachar, Zebulun, and Dinah"],
            refs: ["Genesis 29–30", "Ruth 4:11"],
          }, [
            N("reuben", "Reuben", "son", { era: "Twelve Tribes", date: "c. 1815 BC", role: "Firstborn — birthright forfeited", summary: "Firstborn of Jacob; lost his birthright after sleeping with his father's concubine Bilhah.", significance: "Forfeit of firstborn rights opened the door for inheritance to pass to Joseph (double portion via Ephraim and Manasseh) and the messianic line to Judah.", events: ["Slept with Bilhah; cursed in Genesis 49:3–4"], refs: ["Genesis 35:22, 49:3–4", "1 Chronicles 5:1"] }),
            N("simeon", "Simeon", "son", { era: "Twelve Tribes", date: "c. 1813 BC", role: "Tribe absorbed into Judah", summary: "Second son of Leah; with Levi, massacred the men of Shechem in revenge for Dinah.", significance: "Cursed alongside Levi (Genesis 49:5–7); tribe was scattered and effectively absorbed into Judah's territory.", events: ["Shechem massacre (Genesis 34)"], refs: ["Genesis 34, 49:5–7"] }),
            N("levi", "Levi", "son", { pivot: true, era: "Twelve Tribes", date: "c. 1811 BC", role: "Priestly tribe — no land", summary: "Third son of Leah. The Levites became Israel's priestly tribe — Moses, Aaron, and the entire priesthood descend from him.", significance: "Although cursed for the Shechem violence, the tribe was rehabilitated at Sinai when they alone rallied to Moses against the golden calf. Received no land allotment because \"the Lord is their inheritance.\"", events: ["Faithful at the golden calf (Exodus 32)", "Aaronic priesthood instituted", "Levitical cities established (Numbers 35)"], refs: ["Exodus 32", "Numbers 3, 18, 35", "Deuteronomy 33:8–11"] }),
            N("judah", "Judah", "son", {
              pivot: true, era: "Twelve Tribes", date: "c. 1809 BC", role: "Royal / messianic tribe",
              summary: "Fourth son of Leah. After his three older brothers were disqualified, leadership and the messianic line passed to him.",
              significance: "Genesis 49:10 — \"the scepter shall not depart from Judah\" — is the foundational messianic prophecy. Every Davidic king, and ultimately Jesus, descends from Judah.",
              events: ["Suggested selling Joseph rather than killing him (Genesis 37)", "Fathered Perez through Tamar (Genesis 38)", "Pledged his own life for Benjamin's safety (Genesis 44)", "Received the messianic blessing (Genesis 49:8–12)"],
              refs: ["Genesis 38, 44, 49:8–12", "Revelation 5:5"],
            }, [
              N("tamar", "Tamar", "mother", {
                pivot: true, era: "Egyptian Sojourn", date: "c. 1770 BC", role: "Daughter-in-law of Judah; mother of Perez",
                summary: "Widow of Judah's eldest two sons. When Judah withheld his third son in violation of levirate duty, she disguised herself as a prostitute to obtain offspring from Judah himself.",
                significance: "First of four women Matthew names in Jesus's genealogy. Her story is interrupted in the middle of the Joseph narrative (Genesis 38) precisely to mark the beginning of the messianic line.",
                events: ["Widowed twice (Genesis 38)", "Disguised as prostitute, conceived by Judah", "Vindicated when Judah said \"she is more righteous than I\""],
                refs: ["Genesis 38", "Ruth 4:12", "Matthew 1:3"],
              }, [
                N("perez", "Perez", "son", { era: "Egyptian Sojourn", date: "c. 1750 BC", role: "Son of Judah and Tamar", summary: "Born of Tamar's bold maneuver. Twin brother Zerah grasped first but Perez emerged first — a recurring younger-supplants-older motif.", significance: "Patriarch of the Perezite clan from which David descends.", events: [], refs: ["Genesis 38", "Ruth 4:18", "1 Chronicles 2:4", "Matthew 1:3"] }, [
                  N("hezron", "Hezron", "son", { era: "Egyptian Sojourn", date: "c. 1700 BC", role: "Grandson of Judah", summary: "Bridge generation during the Egyptian sojourn.", significance: "Founding ancestor of the Hezronite clan within Judah.", events: [], refs: ["Ruth 4:18", "1 Chronicles 2:5", "Matthew 1:3"] }, [
                    N("ram", "Ram", "son", { era: "Egyptian Sojourn", date: "c. 1650 BC", role: "Son of Hezron", summary: "Mentioned only in genealogies; spans the Egyptian captivity period.", significance: "Continues the Judahite line during Israel's 400 years in Egypt.", events: [], refs: ["Ruth 4:19", "Matthew 1:3–4"] }, [
                      N("amminadab", "Amminadab", "son", { era: "Exodus Era", date: "c. 1450 BC", role: "Father-in-law of Aaron", summary: "His daughter Elisheba married Aaron the high priest, joining the Judahite royal line to the Levitical priesthood.", significance: "First marriage between Judah and Levi — royal and priestly tribes — prefigures the Christ who unites both offices.", events: ["Daughter Elisheba married Aaron (Exodus 6:23)"], refs: ["Exodus 6:23", "Ruth 4:19–20", "Matthew 1:4"] }, [
                        N("nahshon", "Nahshon", "son", { era: "Exodus Era", date: "c. 1400 BC", role: "Prince of Judah at Sinai", summary: "Leader of the tribe of Judah during the wilderness wanderings.", significance: "Jewish tradition holds Nahshon was the first to step into the Red Sea, prompting its parting. Brother-in-law of Aaron.", events: ["Census leader of Judah (Numbers 1:7)", "Presented offerings first at the tabernacle dedication"], refs: ["Numbers 1:7, 7:12", "Matthew 1:4"] }, [
                          N("salmon", "Salmon", "son", { era: "Conquest", date: "c. 1380 BC", role: "Husband of Rahab", summary: "Lived during Joshua's conquest of Canaan.", significance: "His marriage to Rahab grafts a Canaanite into the messianic line.", events: ["Married Rahab after the fall of Jericho"], refs: ["Ruth 4:20–21", "Matthew 1:5", "Joshua 2, 6"] }, [
                            N("rahab", "Rahab", "mother", {
                              pivot: true, era: "Conquest", date: "c. 1370 BC", role: "Canaanite of Jericho; mother of Boaz",
                              summary: "Prostitute of Jericho who hid the Israelite spies, securing safe passage for her family when the city fell. Married into the tribe of Judah.",
                              significance: "Second of Matthew's four women. Gentile, prostitute, declared righteous by faith (Hebrews 11:31) and works (James 2:25) — a remarkable theological convergence.",
                              events: ["Hid the spies; lowered them by a scarlet cord (Joshua 2)", "Family spared at the fall of Jericho (Joshua 6)", "Married Salmon, fathered Boaz"],
                              refs: ["Joshua 2, 6", "Matthew 1:5", "Hebrews 11:31", "James 2:25"],
                            }, [
                              N("boaz", "Boaz", "son", { pivot: true, era: "Judges Era", date: "c. 1150 BC", role: "Kinsman-redeemer of Ruth", summary: "Wealthy landowner of Bethlehem who married the Moabite widow Ruth under the kinsman-redeemer custom.", significance: "The kinsman-redeemer (goel) role becomes a major Christological type — Christ as the redeemer who pays the price to restore the inheritance.", events: ["Allowed Ruth to glean (Ruth 2)", "Redeemed Naomi's land and married Ruth (Ruth 4)"], refs: ["Ruth 2–4", "Matthew 1:5"] }, [
                                N("ruth", "Ruth", "mother", {
                                  pivot: true, era: "Judges Era", date: "c. 1140 BC", role: "Moabite widow; mother of Obed",
                                  summary: "Moabite woman who clung to her widowed mother-in-law Naomi after her own husband died, swearing the famous oath \"your people shall be my people, and your God my God.\"",
                                  significance: "Third of Matthew's four women. A Moabite — an ethnic group cursed in Deuteronomy 23:3 — is grafted into the line of David. The book of Ruth is essentially the origin story of David's great-grandparents.",
                                  events: ["Refused to leave Naomi (Ruth 1:16)", "Gleaned in Boaz's field (Ruth 2)", "Threshing-floor proposal (Ruth 3)", "Married Boaz; bore Obed (Ruth 4)"],
                                  refs: ["Ruth 1–4", "Matthew 1:5"],
                                }, [
                                  N("obed", "Obed", "son", { era: "Judges Era", date: "c. 1130 BC", role: "Father of Jesse", summary: "Son of Boaz and Ruth, raised symbolically as the heir of Naomi.", significance: "Bridge generation connecting the Ruth narrative to the Davidic monarchy.", events: [], refs: ["Ruth 4:17, 21–22", "Matthew 1:5"] }, [
                                    N("jesse", "Jesse", "son", { era: "Late Judges", date: "c. 1100 BC", role: "Father of David", summary: "Bethlehemite shepherd-farmer, father of eight sons including David, the youngest.", significance: "Isaiah 11:1 prophesies the Messiah as \"a shoot from the stump of Jesse\" — making \"Jesse\" itself a messianic title.", events: ["Hosted Samuel's anointing of David (1 Samuel 16)"], refs: ["1 Samuel 16, 17", "Isaiah 11:1, 10", "Matthew 1:5–6"] }, [
                                      N("david", "David", "king", {
                                        pivot: true, era: "United Monarchy", date: "r. 1010–970 BC", role: "King of Israel",
                                        summary: "Shepherd, warrior, poet, second king of Israel. Founder of the dynasty that ruled Judah for over 400 years.",
                                        significance: "The Davidic Covenant (2 Samuel 7) promises an eternal throne — the foundational messianic promise the New Testament treats as fulfilled in Jesus. \"Son of David\" becomes the standard messianic title.",
                                        events: ["Anointed by Samuel as a youth (1 Samuel 16)", "Killed Goliath (1 Samuel 17)", "Captured Jerusalem (2 Samuel 5)", "Davidic Covenant (2 Samuel 7)", "Affair with Bathsheba; murder of Uriah (2 Samuel 11)", "Author of many Psalms"],
                                        refs: ["1 Samuel 16 – 1 Kings 2", "Psalms", "2 Samuel 7", "Matthew 1:6"],
                                      }, [
                                        N("bathsheba", "Bathsheba", "mother", {
                                          pivot: true, era: "United Monarchy", date: "c. 990 BC", role: "Wife of David; mother of Solomon",
                                          summary: "Wife of Uriah the Hittite, taken by David in adultery. Their first child died as judgment; their second was Solomon, who succeeded David.",
                                          significance: "Fourth of Matthew's four women — and the only one Matthew refuses to name directly, calling her \"the wife of Uriah\" to keep the scandal in view. Politically she secured Solomon's succession against the older claim of Adonijah.",
                                          events: ["Affair with David, death of Uriah (2 Samuel 11)", "First child died (2 Samuel 12)", "Bore Solomon and Nathan", "Secured Solomon's throne (1 Kings 1)"],
                                          refs: ["2 Samuel 11–12", "1 Kings 1–2", "Matthew 1:6"],
                                        }, [
                                          N("solomon", "Solomon", "king", {
                                            pivot: true, era: "United Monarchy", date: "r. 970–930 BC", role: "Builder of the First Temple",
                                            summary: "Son of David and Bathsheba. Famous for wisdom and the Temple in Jerusalem.",
                                            significance: "Built the First Temple, centralizing Israelite worship. His later compromises with foreign wives and pagan worship triggered the kingdom split. Traditional author of Proverbs, Ecclesiastes, and Song of Songs.",
                                            events: ["Anointed king while David lived (1 Kings 1)", "Asked God for wisdom (1 Kings 3)", "Built the First Temple (1 Kings 6)", "Married 700 wives, 300 concubines", "Idolatry sets up the kingdom division"],
                                            refs: ["1 Kings 1–11", "2 Chronicles 1–9", "Matthew 1:6–7"],
                                          }, [
                                            N("naamah", "Naamah", "mother", {
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
                                                      N("joram", "Joram", "king", { era: "Divided Kingdom", date: "r. 848–841 BC", role: "King of Judah; married Athaliah", summary: "Married Athaliah daughter of Ahab and Jezebel, importing Baal worship into Judah. Killed his own brothers to secure the throne.", significance: "Matthew skips the next three kings (Ahaziah, Joash, Amaziah) here — likely to fit his 14-generation pattern.", events: ["Married Athaliah", "Killed all his brothers"], refs: ["2 Kings 8", "2 Chronicles 21", "Matthew 1:8"] }, [
                                                        N("uzziah", "Uzziah", "king", { era: "Divided Kingdom", date: "r. 792–740 BC", role: "Long, prosperous reign", summary: "Reigned 52 years; expanded Judah territory and military. Struck with leprosy after presuming to offer incense in the Temple.", significance: "Isaiah's call to prophetic ministry came \"in the year that King Uzziah died\" (Isaiah 6:1). Contemporary of Amos and Hosea.", events: ["Military expansion", "Struck with leprosy for Temple presumption"], refs: ["2 Kings 14–15", "2 Chronicles 26", "Isaiah 6:1", "Matthew 1:8–9"] }, [
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
                                                                                              N("joseph-nazareth", "Joseph", "son", {
                                                                                                pivot: true, era: "Roman Period", date: "c. 20 BC – c. 30 AD", role: "Legal father of Jesus",
                                                                                                summary: "Carpenter of Nazareth, betrothed to Mary. Received angelic confirmation of Mary's pregnancy in a dream.",
                                                                                                significance: "Provides Jesus's legal Davidic descent. His adoption of Jesus through naming him conveys royal lineage in Jewish law. Disappears from the narrative by Jesus's public ministry — likely deceased.",
                                                                                                events: ["Betrothed to Mary; angelic vision", "Census journey to Bethlehem", "Flight to Egypt to escape Herod", "Last mentioned at Temple visit when Jesus was 12"],
                                                                                                refs: ["Matthew 1–2", "Luke 1–2"],
                                                                                              }, [
                                                                                                N("mary", "Mary", "mother", {
                                                                                                  pivot: true, era: "Roman Period", date: "c. 18 BC – c. 50 AD", role: "Mother of Jesus",
                                                                                                  summary: "Young Jewish woman of Nazareth, betrothed to Joseph. Conceived Jesus by the Holy Spirit, fulfilling Isaiah 7:14.",
                                                                                                  significance: "The biological link to David through Luke's alternative genealogy (which traces through David's son Nathan rather than Solomon). Her Magnificat (Luke 1:46–55) is one of the most theologically rich texts in the New Testament.",
                                                                                                  events: ["Annunciation by the angel Gabriel (Luke 1)", "The Magnificat", "Birth in Bethlehem", "Flight to Egypt", "Present at the crucifixion (John 19)", "Present at Pentecost (Acts 1)"],
                                                                                                  refs: ["Luke 1–2", "Matthew 1–2", "John 2, 19", "Acts 1:14"],
                                                                                                }, [
                                                                                                  N("jesus", "Jesus", "patriarch", {
                                                                                                    pivot: true, era: "Roman Period", date: "c. 4 BC – c. 30 AD", role: "Messiah",
                                                                                                    summary: "Born in Bethlehem during the reign of Herod the Great. Presented in the New Testament as the fulfillment of every covenant traced through this entire genealogy.",
                                                                                                    significance: "The endpoint Matthew is constructing the genealogy toward. Three sets of fourteen generations (14 = numerical value of \"David\" in Hebrew) make the Davidic claim structurally explicit. Luke's genealogy traces through Nathan and back to Adam, framing Jesus as the second Adam.",
                                                                                                    events: ["Born in Bethlehem (c. 4 BC)", "Ministry began c. 27 AD", "Crucified under Pontius Pilate", "Resurrection on the third day", "Ascension"],
                                                                                                    refs: ["Matthew 1:16–25", "Luke 1–2", "Galatians 4:4", "Hebrews 1", "Revelation 22:16"],
                                                                                                  }),
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
              N("issachar", "Issachar", "son", { era: "Twelve Tribes", date: "c. 1807 BC", role: "Tribe of Issachar", summary: "Fifth son of Leah.", significance: "Settled in fertile lower Galilee. Tribe blessed for understanding \"the times\" (1 Chronicles 12:32).", events: [], refs: ["Genesis 49:14–15"] }),
              N("zebulun", "Zebulun", "son", { era: "Twelve Tribes", date: "c. 1805 BC", role: "Tribe of Zebulun", summary: "Sixth and last son of Leah; tribe of seafarers per Genesis 49:13.", significance: "Galilee region — Isaiah 9:1–2 prophesies \"the people walking in darkness\" of Zebulun would see a great light, fulfilled in Jesus's Galilean ministry.", events: [], refs: ["Genesis 49:13", "Isaiah 9:1–2", "Matthew 4:13–16"] }),
            ]),
            N("rachel", "Rachel", "mother", {
              era: "Twelve Tribes", date: "c. 1825 BC", role: "Beloved wife of Jacob; mother of Joseph and Benjamin",
              summary: "Younger daughter of Laban, the woman Jacob loved. After years of barrenness bore Joseph; died in childbirth bearing Benjamin.",
              significance: "Her tomb near Bethlehem becomes a symbol of national grief — Jeremiah 31:15 \"Rachel weeping for her children\" is applied by Matthew to Herod's slaughter of the Bethlehem infants.",
              events: ["Met Jacob at the well (Genesis 29)", "Stole her father's household gods (Genesis 31)", "Bore Joseph after long barrenness", "Died bearing Benjamin (Genesis 35)"],
              refs: ["Genesis 29–35", "Jeremiah 31:15", "Matthew 2:18"],
            }, [
              N("joseph-egypt", "Joseph", "son", {
                pivot: true, era: "Twelve Tribes / Egypt", date: "c. 1800 BC", role: "Vizier of Egypt",
                summary: "Sold into slavery by his brothers, rose to second-in-command of Egypt, and saved his family from famine — placing Israel in Egypt for 400 years.",
                significance: "Joseph never had a tribe named for him. Instead his two sons Ephraim and Manasseh each received a full tribal allotment — a \"double portion\" inheritance taking the place of Reuben's forfeited firstborn rights.",
                events: ["Sold into slavery by his brothers (Genesis 37)", "Imprisoned over Potiphar's wife", "Interpreted Pharaoh's dreams; made vizier (Genesis 41)", "Reconciled with brothers; brought Israel to Egypt", "Adopted Ephraim and Manasseh (Genesis 48)"],
                refs: ["Genesis 37–50", "Hebrews 11:22"],
              }, [
                N("asenath", "Asenath", "mother", {
                  era: "Egyptian Sojourn", date: "c. 1780 BC", role: "Egyptian wife of Joseph; mother of Ephraim & Manasseh",
                  summary: "Daughter of Potiphera, priest of On (Heliopolis). Given to Joseph by Pharaoh as part of his elevation.",
                  significance: "An Egyptian woman becomes the mother of two of Israel's tribes — the most prominent gentile inclusion in the patriarchal era.",
                  events: ["Married Joseph (Genesis 41:45)"], refs: ["Genesis 41:45, 50; 46:20"],
                }, [
                  N("ephraim", "Ephraim", "son", { era: "Twelve Tribes", date: "c. 1770 BC", role: "Tribe of Ephraim", summary: "Younger son of Joseph; received the greater blessing despite being younger.", significance: "Dominant northern tribe; \"Ephraim\" becomes synonymous with the entire northern kingdom in many prophetic texts.", events: ["Adopted and blessed by Jacob with the right-hand blessing (Genesis 48)"], refs: ["Genesis 48", "Hosea 4–14"] }),
                  N("manasseh-tribe", "Manasseh", "son", { era: "Twelve Tribes", date: "c. 1772 BC", role: "Tribe of Manasseh", summary: "Elder son of Joseph; tribe split with half east and half west of the Jordan.", significance: "Distinct from King Manasseh. The largest tribal territory by area, bridging both sides of the Jordan.", events: [], refs: ["Genesis 48", "Numbers 32", "Joshua 13, 17"] }),
                ]),
              ]),
              N("benjamin", "Benjamin", "son", {
                pivot: true, era: "Twelve Tribes", date: "c. 1790 BC", role: "Tribe of Benjamin",
                summary: "Youngest son of Jacob; only full brother of Joseph. Rachel died bearing him, naming him Ben-Oni (\"son of my sorrow\") before Jacob renamed him Benjamin (\"son of the right hand\").",
                significance: "Tribe produced Israel's first king Saul. After the kingdom split, Benjamin was the only tribe besides Judah that remained loyal to David's house. The apostle Paul was also from Benjamin.",
                events: ["Birth of Benjamin; death of Rachel (Genesis 35)", "Centerpiece of Joseph's reconciliation drama (Genesis 42–45)", "Tribe nearly annihilated in the Gibeah civil war", "Saul anointed first king (1 Samuel 9–10)"],
                refs: ["Genesis 35, 42–45", "Judges 19–21", "1 Samuel 9", "Philippians 3:5"],
              }),
            ]),
            N("bilhah", "Bilhah", "mother", {
              era: "Twelve Tribes", date: "c. 1820 BC", role: "Rachel's handmaid; mother of Dan & Naphtali",
              summary: "Maidservant given to Jacob as a surrogate when Rachel was unable to conceive.",
              significance: "Her sons counted as Rachel's legally; established two of the twelve tribes.",
              events: [], refs: ["Genesis 30:1–8"],
            }, [
              N("dan", "Dan", "son", { era: "Twelve Tribes", date: "c. 1818 BC", role: "Tribe of Dan", summary: "Eldest son of Bilhah.", significance: "Tribe of Samson. Conspicuously absent from the list of sealed tribes in Revelation 7, possibly due to early adoption of idolatry (Judges 18).", events: [], refs: ["Genesis 49:16–17", "Judges 13–18"] }),
              N("naphtali", "Naphtali", "son", { era: "Twelve Tribes", date: "c. 1816 BC", role: "Tribe of Naphtali", summary: "Second son of Bilhah; settled in upper Galilee.", significance: "Like Zebulun, included in Isaiah 9 / Matthew 4 — the Galilean region of Jesus's public ministry.", events: [], refs: ["Genesis 49:21", "Isaiah 9:1–2"] }),
            ]),
            N("zilpah", "Zilpah", "mother", {
              era: "Twelve Tribes", date: "c. 1822 BC", role: "Leah's handmaid; mother of Gad & Asher",
              summary: "Maidservant given to Jacob by Leah after she stopped conceiving.",
              significance: "Her sons counted as Leah's legally; established two of the twelve tribes.",
              events: [], refs: ["Genesis 30:9–13"],
            }, [
              N("gad", "Gad", "son", { era: "Twelve Tribes", date: "c. 1820 BC", role: "Tribe of Gad", summary: "Eldest son of Zilpah.", significance: "Settled east of the Jordan; warriors known for their skill (1 Chronicles 12:8).", events: [], refs: ["Genesis 49:19", "Numbers 32"] }),
              N("asher", "Asher", "son", { era: "Twelve Tribes", date: "c. 1818 BC", role: "Tribe of Asher", summary: "Second son of Zilpah; settled along the Mediterranean coast.", significance: "Blessed with rich agricultural land. The prophetess Anna at Jesus's presentation in the Temple was of this tribe (Luke 2:36).", events: [], refs: ["Genesis 49:20", "Luke 2:36"] }),
            ]),
          ]),
        ]),
      ]),
    ]),
  ]),
  N("hagar", "Hagar", "mother", {
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
]);

/* ============================================================
   FLATTEN — ID lookup
   ============================================================ */
const allNodes: Record<string, PersonNode> = (() => {
  const map: Record<string, PersonNode> = {};
  const walk = (n: PersonNode): void => {
    map[n.id] = n;
    (n.children ?? []).forEach(walk);
  };
  walk(data);
  return map;
})();
const allIds = Object.keys(allNodes);

/* ============================================================
   LAYOUT
   ============================================================ */
const X_UNIT = 220;
const Y_UNIT = 70;

function computeHeight(node: PersonNode, expanded: Set<string>): number {
  if (!expanded.has(node.id) || !node.children?.length) return 1;
  return node.children.reduce((sum, c) => sum + computeHeight(c, expanded), 0);
}

function layoutTree(
  node: PersonNode,
  depth: number,
  top: number,
  expanded: Set<string>,
  positions: LayoutPosition[] = []
): LayoutPosition[] {
  const h = computeHeight(node, expanded);
  positions.push({
    id: node.id,
    node,
    x: depth * X_UNIT,
    y: (top + h / 2) * Y_UNIT,
  });
  if (expanded.has(node.id) && node.children) {
    let childTop = top;
    for (const child of node.children) {
      layoutTree(child, depth + 1, childTop, expanded, positions);
      childTop += computeHeight(child, expanded);
    }
  }
  return positions;
}

function getConnections(positions: LayoutPosition[], expanded: Set<string>): Connection[] {
  const byId: Record<string, LayoutPosition> = Object.fromEntries(positions.map((p) => [p.id, p]));
  const out: Connection[] = [];
  for (const p of positions) {
    if (!expanded.has(p.id) || !p.node.children) continue;
    for (const child of p.node.children) {
      if (byId[child.id]) {
        out.push({
          fromId: p.id,
          toId: child.id,
          from: p,
          to: byId[child.id],
          isMarriage: child.type === "mother",
        });
      }
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
  surfaceHover: "#241f18",
  border: "#3a302a",
  borderPivot: "#8b6f47",
  borderSelected: "#d4a574",
  line: "#3a302a",
  lineMarriage: "#5a4a3a",
  text: "#f5efe4",
  textMother: "#cdbea3",
  textMuted: "#a89e90",
  textFaint: "#6b6258",
  accent: "#d4a574",
  accentDeep: "#b8884d",
  panelBg: "#16120e",
} as const;

function getNodeSize(node: PersonNode): { w: number; h: number } {
  if (node.type === "mother") return { w: 130, h: 38 };
  if (node.pivot) return { w: 168, h: 50 };
  return { w: 156, h: 44 };
}

/* ============================================================
   NODE
   ============================================================ */
interface NodeShapeProps {
  position: LayoutPosition;
  isExpanded: boolean;
  hasChildren: boolean;
  isSelected: boolean;
  onClick: () => void;
}

function NodeShape({ position, isExpanded, hasChildren, isSelected, onClick }: NodeShapeProps) {
  const { x, y, node } = position;
  const { w, h } = getNodeSize(node);
  const isMother = node.type === "mother";
  const isPivot = !!node.pivot;

  const fill = isSelected ? C.surfaceHover : isMother ? C.surfaceMother : C.surface;
  const stroke = isSelected ? C.borderSelected : isPivot ? C.borderPivot : C.border;
  const strokeWidth = isSelected ? 2 : 1;
  const rx = isMother ? 19 : 6;

  return (
    <g
      transform={`translate(${x},${y})`}
      style={{ cursor: "pointer", transition: "transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)" }}
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
        style={{ transition: "fill 0.2s, stroke 0.2s, stroke-width 0.2s" }}
      />
      {isPivot && !isMother && <circle cx={-w / 2 + 12} cy={0} r={3} fill={C.accent} />}
      <text
        x={isPivot && !isMother ? -w / 2 + 22 : 0}
        y={0}
        textAnchor={isPivot && !isMother ? "start" : "middle"}
        dominantBaseline="middle"
        fill={isMother ? C.textMother : C.text}
        fontSize={isMother ? 13 : isPivot ? 15 : 14}
        fontWeight={isPivot ? 500 : 450}
        fontStyle={isMother ? "italic" : "normal"}
        fontFamily={FONT}
        letterSpacing={isPivot ? "-0.01em" : "normal"}
        style={{ pointerEvents: "none", userSelect: "none" }}
      >
        {node.name}
      </text>
      {hasChildren && (
        <g transform={`translate(${w / 2 - 14}, 0)`} style={{ pointerEvents: "none" }}>
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
function ConnectionPath({ conn }: { conn: Connection }) {
  const fromSize = getNodeSize(conn.from.node);
  const toSize = getNodeSize(conn.to.node);
  const x1 = conn.from.x + fromSize.w / 2;
  const y1 = conn.from.y;
  const x2 = conn.to.x - toSize.w / 2;
  const y2 = conn.to.y;
  const midX = (x1 + x2) / 2;
  const path = `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`;
  return (
    <path
      d={path}
      fill="none"
      stroke={conn.isMarriage ? C.lineMarriage : C.line}
      strokeWidth={1.2}
      strokeDasharray={conn.isMarriage ? "4 3" : undefined}
      opacity={0.7}
      className="connection-fade-in"
    />
  );
}

/* ============================================================
   DETAIL PANEL
   ============================================================ */
interface DetailPanelProps {
  node: PersonNode | null;
  onClose: () => void;
}

function DetailPanel({ node, onClose }: DetailPanelProps) {
  if (!node) return null;
  const isPivot = !!node.pivot;

  const Section = ({
    icon,
    label,
    children,
  }: {
    icon: React.ReactNode;
    label: string;
    children: React.ReactNode;
  }) => (
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

  return (
    <div
      className="flex flex-col h-full overflow-hidden"
      style={{
        width: 420,
        background: C.panelBg,
        borderLeft: `1px solid ${C.border}`,
        fontFamily: FONT,
        animation: "slideInRight 0.35s cubic-bezier(0.2, 0.8, 0.2, 1)",
      }}
    >
      <div style={{ padding: "24px 28px 18px", borderBottom: `1px solid ${C.border}` }}>
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
          </div>
          <button
            onClick={onClose}
            style={{
              color: C.textMuted,
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: 4,
              marginRight: -4,
              marginTop: -4,
            }}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        <h2
          style={{
            color: C.text,
            fontSize: 30,
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

      <div className="flex-1 overflow-y-auto" style={{ padding: "22px 28px 32px" }}>
        {node.summary && (
          <p style={{ color: C.text, fontSize: 15, lineHeight: 1.55, marginBottom: 24 }}>
            {node.summary}
          </p>
        )}

        {node.significance && (
          <Section icon={<Sparkles size={13} style={{ color: C.accent }} />} label="Why this matters">
            <p style={{ color: C.text, fontSize: 14, lineHeight: 1.6 }}>{node.significance}</p>
          </Section>
        )}

        {node.events && node.events.length > 0 && (
          <Section icon={<Calendar size={13} style={{ color: C.accent }} />} label="Key events">
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
          </Section>
        )}

        {node.refs && node.refs.length > 0 && (
          <Section icon={<BookOpen size={13} style={{ color: C.accent }} />} label="Scripture">
            <div style={{ color: C.textMuted, fontSize: 13, fontStyle: "italic", lineHeight: 1.6 }}>
              {node.refs.join(" · ")}
            </div>
          </Section>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   MAIN COMPONENT
   ============================================================ */
export default function Genealogy() {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const gRef = useRef<SVGGElement | null>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  useEffect(() => {
    if (!svgRef.current) return;
    const svgEl = svgRef.current;
    const svg = d3.select<SVGSVGElement, unknown>(svgEl);
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 3])
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

    const w = svgEl.clientWidth;
    const h = svgEl.clientHeight;
    svg.call(zoom.transform, d3.zoomIdentity.translate(w / 2 - 80, h / 2));

    return () => {
      svg.on(".zoom", null);
    };
  }, []);

  const positions = useMemo(() => layoutTree(data, 0, 0, expandedIds), [expandedIds]);
  const connections = useMemo(() => getConnections(positions, expandedIds), [positions, expandedIds]);
  const selectedNode = selectedId ? allNodes[selectedId] ?? null : null;

  const handleNodeClick = (node: PersonNode): void => {
    const next = new Set(expandedIds);
    if (node.children?.length) {
      if (next.has(node.id)) {
        next.delete(node.id);
      } else {
        next.add(node.id);
      }
    }
    setExpandedIds(next);
    setSelectedId(node.id);
  };

  const expandAll = (): void => setExpandedIds(new Set(allIds));

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
        .call(zoomRef.current.transform, d3.zoomIdentity.translate(w / 2 - 80, h / 2));
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

  const fitToScreen = (): void => {
    if (!svgRef.current || !zoomRef.current || positions.length === 0) return;
    const xs = positions.map((p) => p.x);
    const ys = positions.map((p) => p.y);
    const minX = Math.min(...xs) - 100;
    const maxX = Math.max(...xs) + 100;
    const minY = Math.min(...ys) - 60;
    const maxY = Math.max(...ys) + 60;
    const cw = maxX - minX;
    const ch = maxY - minY;
    const sw = svgRef.current.clientWidth;
    const sh = svgRef.current.clientHeight;
    const k = Math.min(sw / cw, sh / ch, 1);
    const tx = sw / 2 - (minX + cw / 2) * k;
    const ty = sh / 2 - (minY + ch / 2) * k;
    d3.select<SVGSVGElement, unknown>(svgRef.current)
      .transition()
      .duration(500)
      .call(zoomRef.current.transform, d3.zoomIdentity.translate(tx, ty).scale(k));
  };

  const btnStyle: React.CSSProperties = {
    color: C.textMuted,
    background: "transparent",
    border: `1px solid ${C.border}`,
    borderRadius: 6,
    padding: "7px 12px",
    fontSize: 12,
    fontFamily: FONT,
    cursor: "pointer",
    letterSpacing: "0.02em",
  };

  const iconBtnStyle: React.CSSProperties = {
    ...btnStyle,
    padding: "7px 9px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  return (
    <div
      className="flex w-full"
      style={{
        height: "100vh",
        background: C.bg,
        fontFamily: FONT,
        overflow: "hidden",
      }}
    >
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideInRight { from { transform: translateX(20px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .node-fade-in { animation: fadeIn 0.35s ease-out; }
        .connection-fade-in { animation: fadeIn 0.5s ease-out; }
        .tool-btn { transition: all 0.15s ease-out; }
        .tool-btn:hover { background: ${C.surfaceHover} !important; color: ${C.text} !important; border-color: ${C.borderPivot} !important; }
        .tool-btn:active { transform: scale(0.96); }
      `}</style>

      <div className="flex-1 flex flex-col" style={{ minWidth: 0, position: "relative" }}>
        <header
          className="flex items-center justify-between"
          style={{
            padding: "16px 24px",
            borderBottom: `1px solid ${C.border}`,
            background: C.bg,
            zIndex: 10,
          }}
        >
          <div>
            <h1
              style={{
                color: C.text,
                fontSize: 20,
                fontWeight: 500,
                letterSpacing: "-0.018em",
                lineHeight: 1.1,
              }}
            >
              Abraham to Jesus
            </h1>
            <div style={{ color: C.textFaint, fontSize: 11, letterSpacing: "0.06em", marginTop: 3 }}>
              click a node to expand · scroll to zoom · drag to pan
            </div>
          </div>

          <div className="flex items-center" style={{ gap: 8 }}>
            <button onClick={expandAll} className="tool-btn" style={btnStyle}>
              Expand all
            </button>
            <button onClick={reset} className="tool-btn" style={btnStyle}>
              Reset
            </button>
            <div style={{ width: 1, height: 24, background: C.border, margin: "0 4px" }} />
            <button onClick={() => zoomBy(0.7)} className="tool-btn" style={iconBtnStyle} title="Zoom out">
              <ZoomOut size={15} />
            </button>
            <button onClick={() => zoomBy(1.4)} className="tool-btn" style={iconBtnStyle} title="Zoom in">
              <ZoomIn size={15} />
            </button>
            <button onClick={fitToScreen} className="tool-btn" style={iconBtnStyle} title="Fit to screen">
              <Maximize2 size={14} />
            </button>
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
          </div>
        </header>

        <div className="flex-1" style={{ position: "relative", overflow: "hidden" }}>
          <svg ref={svgRef} width="100%" height="100%" style={{ display: "block", cursor: "grab" }}>
            <g ref={gRef}>
              {connections.map((c) => (
                <ConnectionPath key={`${c.fromId}-${c.toId}`} conn={c} />
              ))}
              {positions.map((p) => (
                <NodeShape
                  key={p.id}
                  position={p}
                  isExpanded={expandedIds.has(p.id)}
                  hasChildren={!!p.node.children?.length}
                  isSelected={selectedId === p.id}
                  onClick={() => handleNodeClick(p.node)}
                />
              ))}
            </g>
          </svg>

          {expandedIds.size === 0 && !selectedId && (
            <div
              style={{
                position: "absolute",
                bottom: 32,
                left: "50%",
                transform: "translateX(-50%)",
                color: C.textFaint,
                fontSize: 12,
                letterSpacing: "0.04em",
                padding: "10px 18px",
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                pointerEvents: "none",
                animation: "fadeIn 0.6s ease-out",
              }}
            >
              Click <span style={{ color: C.accent }}>Abraham</span> to begin · or{" "}
              <span style={{ color: C.accent }}>Expand all</span> to see the full lineage
            </div>
          )}
        </div>

        <footer
          className="flex items-center justify-between"
          style={{
            padding: "10px 24px",
            borderTop: `1px solid ${C.border}`,
            background: C.bg,
            zIndex: 10,
          }}
        >
          <div className="flex items-center" style={{ gap: 18 }}>
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
                  fontStyle: "italic",
                }}
              />
              <span style={{ color: C.textMuted, fontSize: 11, letterSpacing: "0.04em" }}>mother / matriarch</span>
            </div>
            <div className="flex items-center" style={{ gap: 7 }}>
              <svg width="22" height="6">
                <line x1="0" y1="3" x2="22" y2="3" stroke={C.lineMarriage} strokeDasharray="3 2" strokeWidth="1.2" />
              </svg>
              <span style={{ color: C.textMuted, fontSize: 11, letterSpacing: "0.04em" }}>marriage</span>
            </div>
          </div>
          <div style={{ color: C.textFaint, fontSize: 11, letterSpacing: "0.04em" }}>
            sources: Genesis · Ruth · 1–2 Kings · 1 Chronicles · Matthew 1
          </div>
        </footer>
      </div>

      {selectedNode && <DetailPanel node={selectedNode} onClose={() => setSelectedId(null)} />}
    </div>
  );
}
