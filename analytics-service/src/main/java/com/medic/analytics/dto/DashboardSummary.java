package com.medic.analytics.dto;
import java.util.List;
public record DashboardSummary(
    List<DiseaseCount>  topDiseases,
    List<RegionCount>   casesByRegion,
    List<AlertSummary>  activeAlerts,
    long                casesLast7Days,
    long                activeAlertCount
) {}
