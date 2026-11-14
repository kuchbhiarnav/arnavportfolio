---
title: "Bangladesh Groundwater Arsenic Decision-Support System"
shortTitle: "Bangladesh Groundwater Arsenic Decision-Support System"
summary: "Preparing, classifying and visualising arsenic screening data to support groundwater-safety decisions in Bangladesh, reported at GSA Connects 2024 and 2025."
order: 1
status: owner-supplied
org: "Exceldots AB (remote, from India)"
period: "January – June 2024 (internship); research presented September 2024 and October 2025"
role: "Data Analyst Intern"
collaborators: []
highlights:
  - "6.37 million screening records"
  - "54 districts"
  - "Second author, GSA Connects 2024 and 2025"
problem: "Arsenic in groundwater is a major public-health problem in Bangladesh. Deciding where it is safe to drill means combining screening results with geology and hydrogeology, and the datasets involved are very large, highly imbalanced and held in different sources."
intendedDecision: "Where, and at what depth, can a tubewell be sited so that it is likely to meet the WHO (arsenic below 10 µg/L) and Bangladesh (50 µg/L or below) drinking-water standards?"
constraints:
  - "The tubewell survey data is highly imbalanced, so a standard classifier would be misleading."
  - "Outliers and missing values in the screening and sensor data had to be handled before any analysis."
  - "Two different safety thresholds (WHO and Bangladesh) give different answers for the same well."
data:
  - "Arsenic Risk Reduction Project (ARRP) tubewell screening data: 6.37 million tubewells in 54 districts."
  - "Bore-log data: 279 wells from JICA-DPHE and 61 from the ASMITAS digital groundwater platform (340 in total), grouped into 13 soil textures."
  - "Hydrogeological data from 19 telemetric sensors across six districts: water level, conductivity, temperature and battery voltage."
contribution:
  - "I engineered real-time ETL pipelines to process arsenic contamination datasets and live sensor data across multiple districts in Bangladesh."
  - "I implemented the preprocessing for the 6.37 million arsenic screening records so the data was fit for analysis."
  - "I developed a custom statistical classification model to categorise tubewell safety against international arsenic standards."
  - "I built Power BI dashboards for groundwater-safety decision support."
  - "I designed Figma wireframes for hydrogeological and lithological data visualisations."
  - "I am second author on the GSA Connects 2024 and 2025 abstracts that report this work. The first author is Sanjeev Kumar Sharma."
approach:
  - "The published abstracts describe a requirements analysis with stakeholders including UNICEF, DPHE and academic institutions, which shaped a modular system: extraction and preprocessing in Python, structured storage in MySQL and an interactive Power BI interface."
  - "Sensor series were cleaned with polynomial curve fitting and rolling means. Data collection from a third-party API was automated with a Python script."
  - "To cope with the imbalanced data, the abstracts describe a custom classification algorithm based on Euclidean distance, combined with trend analysis from the telemetry sensors."
  - "Geology was made explorable through Power BI visuals built with the DENEB extension, showing 13 soil textures drawn from the bore logs."
outputs:
  - label: "GSA Connects 2025 abstract (oral, 22 October 2025)"
    url: "https://gsameetings.secure-platform.com/connects25/gallery/rounds/82002/details/14976"
  - label: "GSA Connects 2024 abstract (Paper 62-8, 22 September 2024)"
    url: "https://gsa.confex.com/gsa/2024AM/meetingapp.cgi/Paper/402876"
outcomes:
  - "Reported analytical finding (2025 abstract): in the ARRP data, shallow wells (under 300 ft) were the most affected, with more than one million classified as unsafe. Intermediate (300–500 ft) and deep (over 500 ft) wells showed significantly lower arsenic levels."
outcomeContext: "This is a finding about the dataset, as reported in the abstract. The sources report no measured change in water use, exposure or health, so none is claimed. Records analysed are not people reached."
limitations:
  - "Subsurface evidence is far sparser than the screening data: 340 bore logs and 19 sensors, against 6.37 million tubewell records."
  - "The sources describe a decision-support system and research outputs. Deployment, adoption and public-health outcomes are not documented, so none is claimed."
  - "The abstracts do not report validation metrics for the classification model."
tools:
  - "Figma"
  - "NumPy"
  - "Pandas"
  - "Jupyter"
  - "Matplotlib"
  - "MySQL"
  - "Python"
  - "R"
sources:
  - label: "GSA Connects 2025 programme page"
    url: "https://gsameetings.secure-platform.com/connects25/gallery/rounds/82002/details/14976"
  - label: "GSA Connects 2024 programme page"
    url: "https://gsa.confex.com/gsa/2024AM/meetingapp.cgi/Paper/402876"
  - label: "CV (October 2026)"
    url: "/cv/Arnav-Patnaik-CV.pdf"
updated: "2026-11-07"
---
Safe drinking water starts with a decision that looks simple: where to drill. In Bangladesh that decision has to be made against millions of screening results, subsurface data from different sources and two arsenic standards that do not agree. This project turned those inputs into something a non-specialist can explore.
