---
cardTitle: "Developing a Climate-Resilient Decision Support System for Sustainable Water Solutions"
cardLine: "Drinking Water Safety in Bangladesh - GSA Connects 2024"
readTime: "5 min"
quote: "When data, geology, and machine learning converge, decision-making becomes a tool for public health. This work shows how evidence-driven systems can turn groundwater complexity into safer drinking water for millions."
cover: "../../assets/insights/article2.jpg"
coverAlt: "A girl filling a metal cup with water from a hand pump. Illustrative photograph."
title: "Developing a Climate-Resilient Decision Support System for Sustainable Water Solutions for Drinking Water Safety in Bangladesh"
type: "Conference abstract"
event: "GSA Connects 2024, Anaheim, California (Paper 62-8, Session 62)"
dateLabel: "22 September 2024"
isoDate: "2024-09-22"
authors:
  - "Sanjeev Sharma"
  - "Arnav Patnaik"
  - "Prosun Bhattacharya"
  - "Mattias von Brömssen"
  - "Kazi Matin Ahmed"
  - "Md. Saifur Rahman"
  - "M. Jahid Alam"
  - "Raphael Nowzor"
  - "Nargis Akter"
arnavPosition: "Second author"
format: "Session 62: Groundwater Pollution with Arsenic and Other Geogenic Legacy Contaminants, Related Health Risks and Management II"
related:
  - groundwater-arsenic-decision-support
links:
  - label: "GSA programme page"
    url: "https://gsa.confex.com/gsa/2024AM/meetingapp.cgi/Paper/402876"
  - label: "ResearchGate"
    url: "https://www.researchgate.net/publication/385369676_DEVELOPING_A_CLIMATE-RESILIENT_DECISION_SUPPORT_SYSTEM_FOR_SUSTAINABLE_WATER_SOLUTIONS_FOR_DRINKING_WATER_SAFETY_IN_BANGLADESH"
status: verified
note: "The programme page does not state which author presented."
order: 2
---
In recent decades, reliance on groundwater has increased significantly for water supplies for drinking, agriculture, and industrial use. The complexity of groundwater systems require in-depth knowledge of subsurface conditions to address the challenges for sustainable water management. The present study addresses the critical public health issue of arsenic (As) contamination in Bangladesh's groundwater by developing a Decision Support System (DSS).

The DSS integrates extensive datasets, including arsenic screening, geological, and hydrogeological data, alongside inputs from local stakeholders. The system employs advanced data processing, machine learning algorithms, and interactive visualizations to provide a robust tool for stakeholders to identify suitable tubewell locations that comply with WHO (As < 10 μg/L) and Bangladesh (As ≤ 50 μg/L) standards. Additionally, real-time hydrogeological monitoring and detailed geological visualizations further support the system's analytical depth.

We collected data from the ARRP project, covering 6.37 million tubewells in 54 districts in Bangladesh. Rigorous preprocessing was applied to manage outliers and missing values, ensuring data accuracy. We developed custom statistical models using Euclidean distances to predict arsenic levels and classify tubewells. The geological analysis included borelog data from 279 wells by JICA-DPHE and 61 from ASMITAS digital groundwater platform.

After preprocessing, the datasets were integrated into Power BI with DENEB for customized visualizations, showcasing 13 soil textures like clay, sand, silt, and gravel. The hydrogeological analysis used data from 19 telemetric sensors across six districts to monitor water level, conductivity, temperature, and battery voltage. Data collection was automated using a Python script interacting with a third-party API. Outliers were managed through polynomial curve fitting and rolling mean calculations, ensuring data consistency.

The DSS supports informed decision-making through dynamic visualization and comprehensive insights into groundwater conditions. Despite data imbalance challenges, custom algorithms and trend analysis enhanced predictive capabilities, making the DSS a scalable solution to mitigate public health impacts and promote sustainable water management for a healthier future for Bangladesh.
