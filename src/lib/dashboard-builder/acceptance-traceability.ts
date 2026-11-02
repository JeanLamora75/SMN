/** SMN-375: audit-ready mapping of every validated UX and mockup requirement. */
export const DASHBOARD_RX_TRACEABILITY=[
  {
    "requirement": "UX-DB-01",
    "scenarios": [
      "RX-18",
      "RX-01"
    ]
  },
  {
    "requirement": "UX-DB-02",
    "scenarios": [
      "RX-02"
    ]
  },
  {
    "requirement": "UX-DB-03",
    "scenarios": [
      "RX-02"
    ]
  },
  {
    "requirement": "UX-DB-04",
    "scenarios": [
      "RX-03"
    ]
  },
  {
    "requirement": "UX-DB-05",
    "scenarios": [
      "RX-03"
    ]
  },
  {
    "requirement": "UX-DB-06",
    "scenarios": [
      "RX-04"
    ]
  },
  {
    "requirement": "UX-DB-07",
    "scenarios": [
      "RX-05"
    ]
  },
  {
    "requirement": "UX-DB-08",
    "scenarios": [
      "RX-05"
    ]
  },
  {
    "requirement": "UX-DB-09",
    "scenarios": [
      "RX-06",
      "RX-17"
    ]
  },
  {
    "requirement": "UX-DB-10",
    "scenarios": [
      "RX-19"
    ]
  },
  {
    "requirement": "UX-DB-11",
    "scenarios": [
      "RX-02"
    ]
  },
  {
    "requirement": "UX-DB-12",
    "scenarios": [
      "RX-06",
      "RX-07"
    ]
  },
  {
    "requirement": "UX-DB-13",
    "scenarios": [
      "RX-07"
    ]
  },
  {
    "requirement": "UX-DB-14",
    "scenarios": [
      "RX-12"
    ]
  },
  {
    "requirement": "UX-DB-15",
    "scenarios": [
      "RX-13"
    ]
  },
  {
    "requirement": "UX-DB-16",
    "scenarios": [
      "RX-13"
    ]
  },
  {
    "requirement": "UX-DB-17",
    "scenarios": [
      "RX-01",
      "RX-11"
    ]
  },
  {
    "requirement": "UX-DB-18",
    "scenarios": [
      "RX-01",
      "RX-09"
    ]
  },
  {
    "requirement": "UX-DB-19",
    "scenarios": [
      "RX-22"
    ]
  },
  {
    "requirement": "UX-DB-20",
    "scenarios": [
      "RX-22"
    ]
  },
  {
    "requirement": "UX-DB-21",
    "scenarios": [
      "RX-10"
    ]
  },
  {
    "requirement": "UX-DB-22",
    "scenarios": [
      "RX-10",
      "RX-11",
      "RX-21"
    ]
  },
  {
    "requirement": "UX-DB-23",
    "scenarios": [
      "RX-03",
      "RX-19"
    ]
  },
  {
    "requirement": "UX-DB-24",
    "scenarios": [
      "RX-17",
      "RX-18"
    ]
  },
  {
    "requirement": "UX-DB-25",
    "scenarios": [
      "RX-14"
    ]
  },
  {
    "requirement": "UX-DB-26",
    "scenarios": [
      "RX-15",
      "RX-16"
    ]
  },
  {
    "requirement": "UX-DB-27",
    "scenarios": [
      "RX-16",
      "RX-20"
    ]
  },
  {
    "requirement": "UX-DB-28",
    "scenarios": [
      "RX-12"
    ]
  },
  {
    "requirement": "UX-DB-29",
    "scenarios": [
      "RX-12",
      "RX-13"
    ]
  },
  {
    "requirement": "UX-DB-30",
    "scenarios": [
      "RX-11"
    ]
  },
  {
    "requirement": "UX-DB-31",
    "scenarios": [
      "RX-18"
    ]
  },
  {
    "requirement": "UX-DB-32",
    "scenarios": [
      "RX-10"
    ]
  },
  {
    "requirement": "UX-DB-33",
    "scenarios": [
      "RX-15"
    ]
  },
  {
    "requirement": "MAQ-DB-01",
    "scenarios": [
      "RX-01",
      "RX-22"
    ]
  },
  {
    "requirement": "MAQ-DB-02",
    "scenarios": [
      "RX-06",
      "RX-17"
    ]
  },
  {
    "requirement": "MAQ-DB-03",
    "scenarios": [
      "RX-03",
      "RX-05"
    ]
  },
  {
    "requirement": "MAQ-DB-04",
    "scenarios": [
      "RX-17"
    ]
  },
  {
    "requirement": "MAQ-DB-05",
    "scenarios": [
      "RX-02",
      "RX-09"
    ]
  },
  {
    "requirement": "MAQ-DB-06",
    "scenarios": [
      "RX-19"
    ]
  },
  {
    "requirement": "MAQ-DB-07",
    "scenarios": [
      "RX-06",
      "RX-07"
    ]
  },
  {
    "requirement": "MAQ-DB-08",
    "scenarios": [
      "RX-07",
      "RX-08",
      "RX-14"
    ]
  },
  {
    "requirement": "MAQ-DB-09",
    "scenarios": [
      "RX-15",
      "RX-16"
    ]
  },
  {
    "requirement": "MAQ-DB-10",
    "scenarios": [
      "RX-12",
      "RX-13"
    ]
  }
] as const;
export const DASHBOARD_RX_SCENARIOS=Array.from({length:22},(_,i)=>`RX-${String(i+1).padStart(2,"0")}`);
