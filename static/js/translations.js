/* =========================================================
   WEATHERGPT - MULTILINGUAL SYSTEM
   ========================================================= */

const APP_LANGUAGES = {
    en: "English",
    as: "অসমীয়া",
    bn: "বাংলা",
    brx: "बड़ो",
    doi: "डोगरी",
    gu: "ગુજરાતી",
    hi: "हिन्दी",
    kn: "ಕನ್ನಡ",
    ks: "کٲشُر",
    kok: "कोंकणी",
    mai: "मैथिली",
    ml: "മലയാളം",
    mni: "মৈতৈ",
    mr: "मराठी",
    ne: "नेपाली",
    or: "ଓଡ଼ିଆ",
    pa: "ਪੰਜਾਬੀ",
    sa: "संस्कृतम्",
    sat: "ᱥᱟᱱᱛᱟᱲᱤ",
    sd: "سنڌي",
    ta: "தமிழ்",
    te: "తెలుగు",
    ur: "اردو"
};


/* =========================================================
   TRANSLATIONS
   ========================================================= */

const APP_TRANSLATIONS = {

    /* =====================================================
       ENGLISH
       ===================================================== */

    en: {

        /* ---------- General ---------- */

        new_chat: "New Chat",
        quick_access: "Quick Access",
        todays_weather: "Today's Weather",
        ask_weather: "Ask WeatherGPT about the weather...",
        your_ai_weather_assistant: "Your AI-powered weather assistant",

        loading: "Loading...",
        refresh: "Refresh",
        analyze: "Analyze",
        generate_advisory: "Generate Advisory",
        enable_alerts: "Enable Alerts",
        test_push: "Test Push",
        send_message: "Send message",

        close: "Close",
        cancel: "Cancel",
        save: "Save",
        logout: "Log out",

        /* ---------- Weather ---------- */

        current_weather: "Current Weather",
        humidity: "Humidity",
        wind: "Wind",
        rain: "Rain",
        air_quality: "Air Quality",
        uv_index: "UV Index",

        weather_data_appear: "Weather data will appear here.",

        rain_forecast: "Rain Forecast",
        weather_alerts: "Weather Alerts",
        temperature: "Temperature",

        /* ---------- Insights ---------- */

        weather_insights: "Weather Insights",
        forecast_trends: "Forecast & Trends",
        forecast_24h: "24-Hour Forecast",
        forecast_7d: "7-Day Forecast",
        weather_trends: "Weather Trends",
        detailed_precipitation: "Detailed Precipitation",

        /* ---------- Alerts ---------- */

        alerts_safety: "Alerts & Safety",
        smart_notifications: "Smart Notifications",
        smart_early_warnings: "Smart Early Warnings",
        disaster_intelligence: "Disaster Intelligence",
        flood_cyclone: "Flood & Cyclone Warnings",

        /* ---------- Intelligence ---------- */

        weather_intelligence: "Weather Intelligence",
        nwp_gfs: "NWP / GFS Model",
        accuracy_performance: "Accuracy & Performance",
        ai_recommendations: "AI Recommendations",

        /* ---------- Environment ---------- */

        environment_map: "Environment & Map",
        weather_map: "Interactive Weather Map",
        air_quality_uv: "Air Quality & UV",

        /* ---------- Sector Advisory ---------- */

        sector_advisory: "Sector Advisory",
        agriculture_advisory: "Agriculture Advisory",
        aviation_advisory: "Aviation Advisory",
        marine_advisory: "Marine Advisory",
        urban_advisory: "Urban / Smart City",

        /* ---------- Climate ---------- */

        climate_history: "Climate & History",
        back_to_chat: "Back to Chat",

        /* ---------- Saved / Recent ---------- */

        saved_locations: "Saved Locations",
        no_saved_locations: "No saved locations",
        recent_chats: "Recent Chats",
        no_recent_chats: "No recent chats",
        more_information: "More Information",

        /* ---------- Account ---------- */

        settings: "Settings",
        about_weathergpt: "About WeatherGPT",
        sign_in: "Sign in",
        report: "Report",

        /* ---------- Search / Location ---------- */

        search_location: "Search city, village, area...",
        detect_location: "Detect location",

        detecting_location: "Detecting your current location...",
        detecting_current_location: "Detecting current location...",
        gps_location_detected: "Current GPS location detected",

        using_last_known_location: "Using last known location",
        last_known_location: "Last known location",

        unable_detect_location: "Unable to detect current location",
        location_unavailable: "Location unavailable",
        location_permission_denied: "Location permission denied",
        location_request_timed_out: "Location request timed out",

        allow_location_or_search:
            "Allow location access or search a location manually",

        search_location_manually:
            "Search a location manually",

        /* ---------- Settings ---------- */

        settings_preferences: "Settings & Preferences",
        temperature_unit: "Temperature Unit",
        language: "Language",
        weather_notifications: "Weather Notifications",
        saved_places: "Saved places",
        clear_saved_locations: "Clear all saved locations",
        reset: "Reset",
        save_changes: "Save Changes",

        /* ---------- Reports ---------- */

        weather_report: "Weather Report",
        live_weather_summary: "Live weather summary",

        /* ---------- Notifications ---------- */

        notifications_not_supported:
            "Browser notifications are not supported here.",

        notifications_blocked:
            "Notifications are blocked in browser settings.",

        notification_permission_denied:
            "Notification permission was not granted.",

        background_alerts_enabled:
            "Background weather alerts are now enabled.",

        unable_enable_notifications:
            "Unable to enable background notifications.",

        notification_status:
            "Notification status",

        try_again:
            "Try Again",

        smart_alerts_enabled:
            "Smart alerts are enabled",

        background_push_enabled:
            "Background push is enabled. Alerts can arrive even when this tab is closed.",

        weather_alerts_off:
            "Weather alerts are off",

        enable_browser_notifications:
            "Enable browser notifications to get important weather alerts.",

        agriculture_advisory_unavailable: "Agriculture advisory is unavailable.",
        urban_advisory_unavailable: "Urban advisory is unavailable.",
        aviation_advisory_unavailable: "Aviation advisory is unavailable.",
        marine_advisory_unavailable: "Marine advisory is unavailable.",
        disaster_intelligence_unavailable: "Disaster intelligence is unavailable.",
        location_not_available_load_weather: "Location is not available yet. Load weather first.",
        analyzing_marine_conditions: "Analyzing marine conditions...",
        analyzing_aviation_conditions: "Analyzing aviation weather conditions...",
        unable_generate_marine_advisory: "Unable to generate marine advisory.",
        unable_generate_urban_advisory: "Unable to generate urban advisory.",
        unable_generate_aviation_advisory: "Unable to generate aviation advisory.",
        weather_signal_unavailable: "Weather signal unavailable.",
        weather_intelligence_unavailable: "Weather intelligence is unavailable.",
        analysis_ready_wrf_unavailable: "Analysis ready. WRF is unavailable.",
        analysis_ready_models_compared: "Analysis ready. Available forecast models have been compared.",
        unable_load_weather_intelligence: "Unable to load weather intelligence.",
        weather_intelligence_load_failed: "Weather intelligence could not be loaded.",
        building_unified_early_warnings: "Building unified early warnings...",
        smart_alerts_unavailable: "Smart alerts are unavailable.",
        no_active_smart_alerts: "No active smart alerts for this location.",
        high_priority_conditions: "High-priority conditions detected. Check official warnings before making safety decisions.",
        alert_assessment_complete: "Alert assessment complete.",
        unable_load_smart_alerts: "Unable to load smart alerts.",
        smart_alerts_load_failed: "Smart alerts could not be loaded.",
        unavailable: "Unavailable",
        good: "Good",
        moderate: "Moderate",
        low: "Low",
        high: "High",
        very_high: "Very High",
        extreme: "Extreme",
        hazardous: "Hazardous",
        unhealthy_sensitive: "Unhealthy for Sensitive Groups",
        unhealthy: "Unhealthy",
        very_unhealthy: "Very Unhealthy",
        aqi_data_unavailable: "AQI data is unavailable.",
        aqi_good: "Air quality is good.",
        aqi_moderate: "Air quality is acceptable, with moderate concern for sensitive groups.",
        aqi_unhealthy_sensitive: "Sensitive groups may experience health effects.",
        aqi_unhealthy: "Some people may experience health effects.",
        aqi_very_unhealthy: "Health alert: everyone may experience stronger health effects.",
        aqi_hazardous: "Health emergency conditions may affect everyone.",
        uv_data_unavailable: "UV data is unavailable.",
        uv_low: "Low UV risk.",
        uv_moderate: "Moderate UV risk. Protection may be needed.",
        uv_high: "High UV risk. Protection is recommended.",
        uv_very_high: "Very high UV risk. Extra protection is recommended.",
        uv_extreme: "Extreme UV risk. Avoid prolonged direct sun.",
        unable_load_weather_data: "Unable to load live weather data.",
        forecast_unavailable: "Forecast unavailable.",
        forecast_24h_unavailable: "24-hour forecast unavailable.",

        /* ---------- Dynamic advisory/dashboard labels ---------- */
        weather_based_crop_attention: "WEATHER-BASED CROP ATTENTION",
        temperature: "Temperature", humidity_label: "Humidity", rain_probability: "Rain Probability", wind_label: "Wind",
        weather_risks: "Weather Risks", recommendations: "Recommendations", field_actions: "Field Actions",
        weather_signals_used: "Weather signals used", advisory_support_only: "Advisory support only. Confirm decisions with local agricultural guidance.",
        generating_advisory: "Generating advisory from live weather...", smart_city_weather_risk: "SMART CITY WEATHER RISK",
        priority_actions: "Priority Actions", highest_priority: "Highest priority", no_major_priority: "No major priority",
        weather_related_aviation_risk: "WEATHER-RELATED AVIATION RISK", weather_label: "Weather", gusts: "Gusts",
        visibility: "Visibility", cloud_cover: "Cloud Cover", pressure: "Pressure", thunderstorm_next_12h: "Thunderstorm next 12h",
        heavy_rain_next_12h: "Heavy rain next 12h", strong_wind_next_12h: "Strong wind next 12h", operational_checks: "Operational Checks",
        weather_signals: "Weather signals", decision_support_only_aviation: "Decision-support only. Check official aviation information before flight decisions.",
        marine_weather_risk: "MARINE WEATHER RISK", wave_height: "Wave Height", wave_period: "Wave Period", wind_wave: "Wind Wave",
        swell: "Swell", max_wave: "Max Wave", max_swell: "Max Swell", marine_risks: "Marine Risks",
        decision_support_only_marine: "Decision-support only. Follow official maritime guidance.",
        flood_cyclone_unavailable: "Flood and cyclone warnings are unavailable.", hazard_warning: "Hazard Warning",
        recommended_actions: "Recommended actions", official_signal_detected: "Official signal detected",
        forecast_rule_risk_estimate: "Forecast/rule-based risk estimate", overall_multihazard_risk: "OVERALL MULTI-HAZARD RISK",
        top_hazard: "TOP HAZARD", official_imd_signal: "Official IMD signal", risk: "risk",
        risk_assessment_combines: "Risk assessment combines forecast conditions and official warning signals.",
        active_alert: "active alert", active_alerts: "active alerts", live_label: "LIVE",

        /* ---------- Page headers not already covered by nav labels ---------- */
        nwp_gfs_forecast_title: "NWP / GFS Model Forecast",
        climate_historical_analysis: "Climate & Historical Analysis",
        smart_ai_recommendations: "Smart AI Recommendations",
        urban_decision_support_title: "Urban / Smart City Decision Support",
        accuracy_performance_dashboard: "Accuracy & Performance Dashboard",
        smart_weather_notifications: "Smart Weather Notifications",

        /* ---------- Chart / card sub-titles ---------- */
        hourly_forecast_subtitle: "Hour-by-hour temperature, rain chance, precipitation and wind for the next 24 hours.",
        noaa_gfs: "NOAA GFS",
        nwp_model_subtitle: "Numerical Weather Prediction model via Open-Meteo",
        gfs_temperature_trend: "GFS Temperature Trend",
        gfs_next_24h: "Next 24 hours from the GFS model",
        next_24_hours: "Next 24 Hours",
        temp_rain_wind_subtitle: "Temperature, rain probability & wind",
        seven_day_temp_trend: "7-Day Temperature Trend",
        daily_max_min_subtitle: "Daily maximum & minimum temperature",
        next_24h_rainfall: "Next 24 Hours Rainfall",
        hourly_precip_subtitle: "Hourly precipitation and probability",
        historical_temp_trend: "Historical Temperature Trend",
        annual_avg_temp_subtitle: "Annual average temperature",
        historical_rainfall_trend: "Historical Rainfall Trend",
        total_annual_precip_subtitle: "Total annual precipitation",
        us_aqi_label: "US AQI",
        your_location: "Your location",
        current_temp_caps: "CURRENT TEMP",
        humidity_caps: "HUMIDITY",
        precipitation_caps: "PRECIPITATION",
        wind_caps: "WIND",
        highest_level_caps: "HIGHEST LEVEL",
        total_alerts_caps: "TOTAL ALERTS",
        average_temperature_caps: "AVERAGE TEMPERATURE",
        average_annual_rainfall_caps: "AVERAGE ANNUAL RAINFALL",
        from_label: "From",
        to_label: "To",
        success_rate_caps: "SUCCESS RATE",
        weather_latency_caps: "WEATHER LATENCY",
        ai_chat_latency_caps: "AI CHAT LATENCY",
        session_requests_caps: "SESSION REQUESTS",
        server_requests_label: "Server requests",
        last_average_label: "Last / average",
        since_server_start_label: "Since server start",
        service_health: "Service Health",
        forecast_accuracy: "Forecast Accuracy",
        not_evaluated: "Not evaluated",
        evaluation_mode: "Evaluation mode",
        about_label: "About",
        crop_label: "Crop",
        growth_stage_label: "Growth Stage",
        soil_type_label: "Soil Type",
        not_specified: "Not specified",
        official_imd_warnings_detected: "{count} official IMD warning(s) detected",

        /* ---------- Crop / stage / soil options ---------- */
        crop_wheat: "Wheat", crop_rice: "Rice", crop_maize: "Maize", crop_sugarcane: "Sugarcane",
        crop_potato: "Potato", crop_mustard: "Mustard", crop_cotton: "Cotton", crop_tomato: "Tomato",
        crop_vegetables: "Vegetables",
        stage_sowing: "Sowing", stage_vegetative: "Vegetative", stage_flowering: "Flowering",
        stage_fruiting: "Fruiting / Grain filling", stage_harvest: "Harvest",
        soil_alluvial: "Alluvial", soil_black: "Black soil", soil_red: "Red soil",
        soil_sandy: "Sandy", soil_clay: "Clay", soil_loamy: "Loamy",

        /* ---------- Weekday abbreviations (chart axis labels) ---------- */
        weekday_sun: "Sun", weekday_mon: "Mon", weekday_tue: "Tue", weekday_wed: "Wed",
        weekday_thu: "Thu", weekday_fri: "Fri", weekday_sat: "Sat", today_short: "Today",

        /* ---------- Alerts panel & safety guidance ---------- */
        updated: "Updated",
        view_more_alerts: "View {count} more alert(s)",
        hide_extra_alerts: "Hide extra alerts",
        weather_alert: "Weather Alert",
        safety_dos: "DO'S",
        safety_donts: "DON'TS",
        safety_important: "IMPORTANT",
        safety_official_info: "Official information",
        personal_safety_guidance_for: "Personal safety guidance for",
        what_you_should_do: "What you should do",
        what_you_should_not_do: "What you should not do",
        your_selected_location: "your selected location",
        follow_official_emergency_instructions: "Follow official local emergency instructions when issued.",
        severity_green: "GREEN",
        severity_yellow: "YELLOW",
        severity_orange: "ORANGE",
        severity_red: "RED",
        calls_label: "calls",
        avg_label: "avg",
        last_label: "last",
        no_server_route_calls_yet: "No server route calls yet.",
        evaluated_label: "Evaluated",
        accuracy_requires_reference_observations: "Accuracy requires independent reference observations.",
        live_session_uptime: "Live session uptime",
        attention_label: "Attention",
    },


    /* =====================================================
       HINDI
       ===================================================== */

    hi: {

        /* ---------- General ---------- */

        new_chat: "नई चैट",
        quick_access: "त्वरित पहुँच",
        todays_weather: "आज का मौसम",
        ask_weather: "WeatherGPT से मौसम के बारे में पूछें...",
        your_ai_weather_assistant: "आपका AI आधारित मौसम सहायक",

        loading: "लोड हो रहा है...",
        refresh: "रिफ्रेश",
        analyze: "विश्लेषण करें",
        generate_advisory: "सलाह बनाएँ",
        enable_alerts: "चेतावनियाँ सक्षम करें",
        test_push: "पुश टेस्ट करें",
        send_message: "संदेश भेजें",

        close: "बंद करें",
        cancel: "रद्द करें",
        save: "सहेजें",
        logout: "लॉग आउट",

        /* ---------- Weather ---------- */

        current_weather: "वर्तमान मौसम",
        humidity: "आर्द्रता",
        wind: "हवा",
        rain: "बारिश",
        air_quality: "वायु गुणवत्ता",
        uv_index: "UV सूचकांक",

        weather_data_appear:
            "मौसम डेटा यहाँ दिखाई देगा।",

        rain_forecast: "बारिश का पूर्वानुमान",
        weather_alerts: "मौसम चेतावनियाँ",
        temperature: "तापमान",

        /* ---------- Insights ---------- */

        weather_insights: "मौसम जानकारी",
        forecast_trends: "पूर्वानुमान और रुझान",
        forecast_24h: "24 घंटे का पूर्वानुमान",
        forecast_7d: "7-दिन का पूर्वानुमान",
        weather_trends: "मौसम रुझान",
        detailed_precipitation: "विस्तृत वर्षा जानकारी",

        /* ---------- Alerts ---------- */

        alerts_safety: "चेतावनी और सुरक्षा",
        smart_notifications: "स्मार्ट सूचनाएँ",
        smart_early_warnings: "स्मार्ट प्रारंभिक चेतावनियाँ",
        disaster_intelligence: "आपदा जानकारी",
        flood_cyclone: "बाढ़ और चक्रवात चेतावनियाँ",

        /* ---------- Intelligence ---------- */

        weather_intelligence: "मौसम इंटेलिजेंस",
        nwp_gfs: "NWP / GFS मॉडल",
        accuracy_performance: "सटीकता और प्रदर्शन",
        ai_recommendations: "AI सुझाव",

        /* ---------- Environment ---------- */

        environment_map: "पर्यावरण और मानचित्र",
        weather_map: "इंटरैक्टिव मौसम मानचित्र",
        air_quality_uv: "वायु गुणवत्ता और UV",

        /* ---------- Sector Advisory ---------- */

        sector_advisory: "क्षेत्रीय सलाह",
        agriculture_advisory: "कृषि सलाह",
        aviation_advisory: "विमानन सलाह",
        marine_advisory: "समुद्री सलाह",
        urban_advisory: "शहरी / स्मार्ट सिटी",

        /* ---------- Climate ---------- */

        climate_history: "जलवायु और इतिहास",
        back_to_chat: "चैट पर वापस जाएँ",

        /* ---------- Saved / Recent ---------- */

        saved_locations: "सहेजे गए स्थान",
        no_saved_locations: "कोई सहेजा गया स्थान नहीं",
        recent_chats: "हाल की चैट",
        no_recent_chats: "कोई हाल की चैट नहीं",
        more_information: "अधिक जानकारी",

        /* ---------- Account ---------- */

        settings: "सेटिंग्स",
        about_weathergpt: "WeatherGPT के बारे में",
        sign_in: "साइन इन",
        report: "रिपोर्ट",

        /* ---------- Search / Location ---------- */

        search_location:
            "शहर, गाँव, क्षेत्र खोजें...",

        detect_location:
            "स्थान पहचानें",

        detecting_location:
            "आपका वर्तमान स्थान खोजा जा रहा है...",

        detecting_current_location:
            "वर्तमान स्थान खोजा जा रहा है...",

        gps_location_detected:
            "वर्तमान GPS स्थान मिल गया",

        using_last_known_location:
            "अंतिम ज्ञात स्थान का उपयोग किया जा रहा है",

        last_known_location:
            "अंतिम ज्ञात स्थान",

        unable_detect_location:
            "वर्तमान स्थान का पता नहीं चल सका",

        location_unavailable:
            "स्थान उपलब्ध नहीं है",

        location_permission_denied:
            "स्थान की अनुमति अस्वीकार कर दी गई",

        location_request_timed_out:
            "स्थान अनुरोध का समय समाप्त हो गया",

        allow_location_or_search:
            "स्थान की अनुमति दें या स्थान खोजें",

        search_location_manually:
            "स्थान मैन्युअल रूप से खोजें",

        /* ---------- Settings ---------- */

        settings_preferences:
            "सेटिंग्स और प्राथमिकताएँ",

        temperature_unit:
            "तापमान इकाई",

        language:
            "भाषा",

        weather_notifications:
            "मौसम सूचनाएँ",

        saved_places:
            "सहेजे गए स्थान",

        clear_saved_locations:
            "सभी सहेजे गए स्थान हटाएँ",

        reset:
            "रीसेट",

        save_changes:
            "परिवर्तन सहेजें",

        /* ---------- Reports ---------- */

        weather_report:
            "मौसम रिपोर्ट",

        live_weather_summary:
            "लाइव मौसम सारांश",

        /* ---------- Notifications ---------- */

        notifications_not_supported:
            "इस ब्राउज़र में सूचनाएँ समर्थित नहीं हैं।",

        notifications_blocked:
            "ब्राउज़र सेटिंग्स में सूचनाएँ अवरुद्ध हैं।",

        notification_permission_denied:
            "सूचना की अनुमति नहीं दी गई।",

        background_alerts_enabled:
            "बैकग्राउंड मौसम चेतावनियाँ अब सक्षम हैं।",

        unable_enable_notifications:
            "बैकग्राउंड सूचनाएँ सक्षम नहीं की जा सकीं।",

        notification_status:
            "सूचना स्थिति",

        try_again:
            "फिर से प्रयास करें",

        smart_alerts_enabled:
            "स्मार्ट चेतावनियाँ सक्षम हैं",

        background_push_enabled:
            "बैकग्राउंड पुश सक्षम है। टैब बंद होने पर भी चेतावनियाँ प्राप्त हो सकती हैं।",

        weather_alerts_off:
            "मौसम चेतावनियाँ बंद हैं",

        enable_browser_notifications:
            "महत्वपूर्ण मौसम चेतावनियाँ पाने के लिए ब्राउज़र सूचनाएँ सक्षम करें।",

        agriculture_advisory_unavailable: "कृषि सलाह उपलब्ध नहीं है।",
        urban_advisory_unavailable: "शहरी सलाह उपलब्ध नहीं है।",
        aviation_advisory_unavailable: "विमानन सलाह उपलब्ध नहीं है।",
        marine_advisory_unavailable: "समुद्री सलाह उपलब्ध नहीं है।",
        disaster_intelligence_unavailable: "आपदा इंटेलिजेंस उपलब्ध नहीं है।",
        location_not_available_load_weather: "स्थान अभी उपलब्ध नहीं है। पहले मौसम लोड करें।",
        analyzing_marine_conditions: "समुद्री मौसम की स्थितियों का विश्लेषण किया जा रहा है...",
        analyzing_aviation_conditions: "विमानन मौसम की स्थितियों का विश्लेषण किया जा रहा है...",
        unable_generate_marine_advisory: "समुद्री सलाह तैयार नहीं की जा सकी।",
        unable_generate_urban_advisory: "शहरी सलाह तैयार नहीं की जा सकी।",
        unable_generate_aviation_advisory: "विमानन सलाह तैयार नहीं की जा सकी।",
        weather_signal_unavailable: "मौसम संकेत उपलब्ध नहीं है।",
        weather_intelligence_unavailable: "मौसम इंटेलिजेंस उपलब्ध नहीं है।",
        analysis_ready_wrf_unavailable: "विश्लेषण तैयार है। WRF उपलब्ध नहीं है।",
        analysis_ready_models_compared: "विश्लेषण तैयार है। उपलब्ध पूर्वानुमान मॉडलों की तुलना की गई है।",
        unable_load_weather_intelligence: "मौसम इंटेलिजेंस लोड नहीं हो सकी।",
        weather_intelligence_load_failed: "मौसम इंटेलिजेंस लोड नहीं हो सकी।",
        building_unified_early_warnings: "एकीकृत प्रारंभिक चेतावनियाँ तैयार की जा रही हैं...",
        smart_alerts_unavailable: "स्मार्ट चेतावनियाँ उपलब्ध नहीं हैं।",
        no_active_smart_alerts: "इस स्थान के लिए कोई सक्रिय स्मार्ट चेतावनी नहीं है।",
        high_priority_conditions: "उच्च प्राथमिकता वाली स्थितियाँ पाई गई हैं। सुरक्षा निर्णय लेने से पहले आधिकारिक चेतावनियाँ देखें।",
        alert_assessment_complete: "चेतावनी आकलन पूरा हुआ।",
        unable_load_smart_alerts: "स्मार्ट चेतावनियाँ लोड नहीं हो सकीं।",
        smart_alerts_load_failed: "स्मार्ट चेतावनियाँ लोड नहीं हो सकीं।",
        unavailable: "उपलब्ध नहीं",
        good: "अच्छा",
        moderate: "मध्यम",
        low: "कम",
        high: "उच्च",
        very_high: "बहुत उच्च",
        extreme: "अत्यधिक",
        hazardous: "खतरनाक",
        unhealthy_sensitive: "संवेदनशील समूहों के लिए अस्वास्थ्यकर",
        unhealthy: "अस्वास्थ्यकर",
        very_unhealthy: "बहुत अस्वास्थ्यकर",
        aqi_data_unavailable: "AQI डेटा उपलब्ध नहीं है।",
        aqi_good: "वायु गुणवत्ता अच्छी है।",
        aqi_moderate: "वायु गुणवत्ता सामान्य है, लेकिन संवेदनशील लोगों के लिए कुछ चिंता हो सकती है।",
        aqi_unhealthy_sensitive: "संवेदनशील लोगों पर स्वास्थ्य प्रभाव पड़ सकता है।",
        aqi_unhealthy: "कुछ लोगों पर स्वास्थ्य प्रभाव पड़ सकता है।",
        aqi_very_unhealthy: "स्वास्थ्य चेतावनी: सभी लोगों पर अधिक गंभीर प्रभाव पड़ सकता है।",
        aqi_hazardous: "स्वास्थ्य आपातकाल जैसी स्थिति सभी को प्रभावित कर सकती है।",
        uv_data_unavailable: "UV डेटा उपलब्ध नहीं है।",
        uv_low: "UV जोखिम कम है।",
        uv_moderate: "UV जोखिम मध्यम है। सुरक्षा की आवश्यकता हो सकती है।",
        uv_high: "UV जोखिम उच्च है। सुरक्षा की सलाह दी जाती है।",
        uv_very_high: "UV जोखिम बहुत उच्च है। अतिरिक्त सुरक्षा आवश्यक है।",
        uv_extreme: "UV जोखिम अत्यधिक है। लंबे समय तक सीधी धूप से बचें।",
        unable_load_weather_data: "लाइव मौसम डेटा लोड नहीं हो सका।",
        forecast_unavailable: "पूर्वानुमान उपलब्ध नहीं है।",
        forecast_24h_unavailable: "24 घंटे का पूर्वानुमान उपलब्ध नहीं है।",

        /* ---------- Page headers not already covered by nav labels ---------- */
        nwp_gfs_forecast_title: "NWP / GFS मॉडल पूर्वानुमान",
        climate_historical_analysis: "जलवायु और ऐतिहासिक विश्लेषण",
        smart_ai_recommendations: "स्मार्ट AI सुझाव",
        urban_decision_support_title: "शहरी / स्मार्ट सिटी निर्णय सहायता",
        accuracy_performance_dashboard: "सटीकता और प्रदर्शन डैशबोर्ड",
        smart_weather_notifications: "स्मार्ट मौसम सूचनाएँ",

        /* ---------- Chart / card sub-titles ---------- */
        hourly_forecast_subtitle: "अगले 24 घंटों के लिए प्रति-घंटा तापमान, बारिश की संभावना, वर्षा और हवा।",
        noaa_gfs: "NOAA GFS",
        nwp_model_subtitle: "Open-Meteo के माध्यम से न्यूमेरिकल वेदर प्रेडिक्शन मॉडल",
        gfs_temperature_trend: "GFS तापमान रुझान",
        gfs_next_24h: "GFS मॉडल से अगले 24 घंटे",
        next_24_hours: "अगले 24 घंटे",
        temp_rain_wind_subtitle: "तापमान, बारिश की संभावना और हवा",
        seven_day_temp_trend: "7-दिन का तापमान रुझान",
        daily_max_min_subtitle: "दैनिक अधिकतम और न्यूनतम तापमान",
        next_24h_rainfall: "अगले 24 घंटों की वर्षा",
        hourly_precip_subtitle: "प्रति-घंटा वर्षा और संभावना",
        historical_temp_trend: "ऐतिहासिक तापमान रुझान",
        annual_avg_temp_subtitle: "वार्षिक औसत तापमान",
        historical_rainfall_trend: "ऐतिहासिक वर्षा रुझान",
        total_annual_precip_subtitle: "कुल वार्षिक वर्षा",
        us_aqi_label: "US AQI",
        current_temp_caps: "वर्तमान तापमान",
        humidity_caps: "आर्द्रता",
        precipitation_caps: "वर्षा",
        wind_caps: "हवा",
        highest_level_caps: "उच्चतम स्तर",
        total_alerts_caps: "कुल चेतावनियाँ",
        average_temperature_caps: "औसत तापमान",
        average_annual_rainfall_caps: "औसत वार्षिक वर्षा",
        from_label: "से",
        to_label: "तक",
        success_rate_caps: "सफलता दर",
        weather_latency_caps: "मौसम विलंबता",
        ai_chat_latency_caps: "AI चैट विलंबता",
        session_requests_caps: "सत्र अनुरोध",
        server_requests_label: "सर्वर अनुरोध",
        last_average_label: "अंतिम / औसत",
        since_server_start_label: "सर्वर शुरू होने से",
        service_health: "सेवा स्थिति",
        forecast_accuracy: "पूर्वानुमान सटीकता",
        not_evaluated: "मूल्यांकित नहीं",
        evaluation_mode: "मूल्यांकन मोड",
        about_label: "बारे में",
        crop_label: "फसल",
        growth_stage_label: "वृद्धि चरण",
        soil_type_label: "मिट्टी का प्रकार",
        not_specified: "निर्दिष्ट नहीं",
        official_imd_warnings_detected: "{count} आधिकारिक IMD चेतावनियाँ मिलीं",

        /* ---------- Crop / stage / soil options ---------- */
        crop_wheat: "गेहूँ", crop_rice: "चावल", crop_maize: "मक्का", crop_sugarcane: "गन्ना",
        crop_potato: "आलू", crop_mustard: "सरसों", crop_cotton: "कपास", crop_tomato: "टमाटर",
        crop_vegetables: "सब्जियाँ",
        stage_sowing: "बुवाई", stage_vegetative: "वानस्पतिक वृद्धि", stage_flowering: "फूल आना",
        stage_fruiting: "फल/दाना भरना", stage_harvest: "कटाई",
        soil_alluvial: "जलोढ़", soil_black: "काली मिट्टी", soil_red: "लाल मिट्टी",
        soil_sandy: "बलुई", soil_clay: "चिकनी मिट्टी", soil_loamy: "दोमट",

        /* ---------- Weekday abbreviations (chart axis labels) ---------- */
        weekday_sun: "रवि", weekday_mon: "सोम", weekday_tue: "मंगल", weekday_wed: "बुध",
        weekday_thu: "गुरु", weekday_fri: "शुक्र", weekday_sat: "शनि", today_short: "आज",

        /* ---------- Alerts panel & safety guidance ---------- */
        updated: "अपडेट किया गया",
        view_more_alerts: "{count} और चेतावनी(याँ) देखें",
        hide_extra_alerts: "अतिरिक्त चेतावनियाँ छुपाएँ",
        weather_alert: "मौसम चेतावनी",
        safety_dos: "क्या करें",
        safety_donts: "क्या न करें",
        safety_important: "महत्वपूर्ण",
        safety_official_info: "आधिकारिक जानकारी",
        personal_safety_guidance_for: "इसके लिए व्यक्तिगत सुरक्षा सलाह",
        what_you_should_do: "आपको क्या करना चाहिए",
        what_you_should_not_do: "आपको क्या नहीं करना चाहिए",
        your_selected_location: "आपका चुना गया स्थान",
        follow_official_emergency_instructions: "जारी होने पर आधिकारिक स्थानीय आपातकालीन निर्देशों का पालन करें।",
        severity_green: "हरा",
        severity_yellow: "पीला",
        severity_orange: "नारंगी",
        severity_red: "लाल",
        calls_label: "कॉल",
        avg_label: "औसत",
        last_label: "अंतिम",
        no_server_route_calls_yet: "अभी तक कोई सर्वर रूट कॉल नहीं हुई।",
        evaluated_label: "मूल्यांकित",
        accuracy_requires_reference_observations: "सटीकता के लिए स्वतंत्र संदर्भ अवलोकन आवश्यक हैं।",
        live_session_uptime: "लाइव सत्र अपटाइम",
        attention_label: "ध्यान",
    }
};



/* =========================================================
   ADDITIONAL BUILT-IN LANGUAGE PACKS
   These packs intentionally preserve the existing EN/HI packs.
   Dynamic text continues through the runtime localization layer.
   ========================================================= */

const EXTRA_LANGUAGE_TRANSLATIONS = {
    as: { new_chat:"নতুন চেট", quick_access:"দ্ৰুত প্ৰৱেশ", todays_weather:"আজিৰ বতৰ", ask_weather:"WeatherGPT-ক বতৰৰ বিষয়ে সোধক...", loading:"লোড হৈ আছে...", refresh:"ৰিফ্ৰেছ", analyze:"বিশ্লেষণ কৰক", generate_advisory:"পৰামৰ্শ সৃষ্টি কৰক", current_weather:"বৰ্তমান বতৰ", humidity:"আৰ্দ্ৰতা", wind:"বতাহ", rain:"বৰষুণ", air_quality:"বায়ুৰ গুণগত মান", uv_index:"UV সূচক", weather_alerts:"বতৰ সতৰ্কবাণী", forecast_24h:"২৪ ঘণ্টাৰ পূৰ্বানুমান", forecast_7d:"৭ দিনৰ পূৰ্বানুমান", weather_map:"ইণ্টাৰেক্টিভ বতৰ মানচিত্ৰ", saved_locations:"সংৰক্ষিত স্থান", settings:"ছেটিংছ", language:"ভাষা", weather_report:"বতৰ প্ৰতিবেদন", agriculture_advisory:"কৃষি পৰামৰ্শ", aviation_advisory:"বিমান পৰামৰ্শ", marine_advisory:"সামুদ্ৰিক পৰামৰ্শ", urban_advisory:"নগৰ / স্মাৰ্ট চিটি", disaster_intelligence:"দুৰ্যোগ তথ্য", flood_cyclone:"বান আৰু ঘূৰ্ণীবতাহ সতৰ্কবাণী" },
    bn: { new_chat:"নতুন চ্যাট", quick_access:"দ্রুত প্রবেশ", todays_weather:"আজকের আবহাওয়া", ask_weather:"WeatherGPT-কে আবহাওয়া সম্পর্কে জিজ্ঞাসা করুন...", your_ai_weather_assistant:"আপনার AI-চালিত আবহাওয়া সহায়ক", loading:"লোড হচ্ছে...", refresh:"রিফ্রেশ", analyze:"বিশ্লেষণ করুন", generate_advisory:"পরামর্শ তৈরি করুন", enable_alerts:"সতর্কতা সক্রিয় করুন", test_push:"টেস্ট পুশ", send_message:"বার্তা পাঠান", close:"বন্ধ করুন", cancel:"বাতিল করুন", save:"সংরক্ষণ করুন", logout:"লগ আউট", current_weather:"বর্তমান আবহাওয়া", humidity:"আর্দ্রতা", wind:"বাতাস", rain:"বৃষ্টি", air_quality:"বায়ুর মান", uv_index:"UV সূচক", weather_data_appear:"আবহাওয়ার তথ্য এখানে দেখানো হবে।", rain_forecast:"বৃষ্টির পূর্বাভাস", weather_alerts:"আবহাওয়া সতর্কতা", temperature:"তাপমাত্রা", weather_insights:"আবহাওয়ার তথ্য বিশ্লেষণ", forecast_trends:"পূর্বাভাস ও প্রবণতা", forecast_24h:"২৪ ঘণ্টার পূর্বাভাস", forecast_7d:"৭ দিনের পূর্বাভাস", weather_trends:"আবহাওয়ার প্রবণতা", detailed_precipitation:"বিস্তারিত বৃষ্টিপাত", alerts_safety:"সতর্কতা ও সুরক্ষা", smart_notifications:"স্মার্ট বিজ্ঞপ্তি", smart_early_warnings:"স্মার্ট পূর্ব সতর্কতা", disaster_intelligence:"দুর্যোগ তথ্য", flood_cyclone:"বন্যা ও ঘূর্ণিঝড় সতর্কতা", weather_intelligence:"আবহাওয়া বিশ্লেষণ ব্যবস্থা", nwp_gfs:"NWP / GFS মডেল", accuracy_performance:"নির্ভুলতা ও কার্যক্ষমতা", ai_recommendations:"AI সুপারিশ", environment_map:"পরিবেশ ও মানচিত্র", weather_map:"ইন্টারেক্টিভ আবহাওয়া মানচিত্র", air_quality_uv:"বায়ুর মান ও UV", sector_advisory:"খাতভিত্তিক পরামর্শ", agriculture_advisory:"কৃষি পরামর্শ", aviation_advisory:"বিমান চলাচল পরামর্শ", marine_advisory:"সামুদ্রিক পরামর্শ", urban_advisory:"শহর / স্মার্ট সিটি", climate_history:"জলবায়ু ও ইতিহাস", back_to_chat:"চ্যাটে ফিরে যান", saved_locations:"সংরক্ষিত স্থান", no_saved_locations:"কোনো সংরক্ষিত স্থান নেই", recent_chats:"সাম্প্রতিক চ্যাট", no_recent_chats:"কোনো সাম্প্রতিক চ্যাট নেই", more_information:"আরও তথ্য", settings:"সেটিংস", about_weathergpt:"WeatherGPT সম্পর্কে", sign_in:"সাইন ইন করুন", report:"রিপোর্ট", search_location:"শহর, গ্রাম, এলাকা অনুসন্ধান করুন...", detect_location:"অবস্থান সনাক্ত করুন", detecting_location:"আপনার বর্তমান অবস্থান সনাক্ত করা হচ্ছে...", detecting_current_location:"বর্তমান অবস্থান সনাক্ত করা হচ্ছে...", gps_location_detected:"বর্তমান GPS অবস্থান সনাক্ত হয়েছে", using_last_known_location:"সর্বশেষ জানা অবস্থান ব্যবহার করা হচ্ছে", last_known_location:"সর্বশেষ জানা অবস্থান", unable_detect_location:"বর্তমান অবস্থান সনাক্ত করা সম্ভব হয়নি", location_unavailable:"অবস্থান উপলব্ধ নেই", location_permission_denied:"অবস্থানের অনুমতি প্রত্যাখ্যাত হয়েছে", location_request_timed_out:"অবস্থানের অনুরোধের সময় শেষ হয়ে গেছে", allow_location_or_search:"অবস্থান অ্যাক্সেসের অনুমতি দিন বা নিজে থেকে একটি স্থান অনুসন্ধান করুন", search_location_manually:"নিজে থেকে একটি স্থান অনুসন্ধান করুন", settings_preferences:"সেটিংস ও পছন্দসমূহ", temperature_unit:"তাপমাত্রার একক", language:"ভাষা", weather_notifications:"আবহাওয়া বিজ্ঞপ্তি", saved_places:"সংরক্ষিত স্থান", clear_saved_locations:"সমস্ত সংরক্ষিত স্থান মুছে ফেলুন", reset:"রিসেট করুন", save_changes:"পরিবর্তন সংরক্ষণ করুন", weather_report:"আবহাওয়া প্রতিবেদন", live_weather_summary:"লাইভ আবহাওয়া সারসংক্ষেপ", notifications_not_supported:"এখানে ব্রাউজার বিজ্ঞপ্তি সমর্থিত নয়।", notifications_blocked:"ব্রাউজার সেটিংসে বিজ্ঞপ্তি অবরুদ্ধ করা আছে।", notification_permission_denied:"বিজ্ঞপ্তির অনুমতি দেওয়া হয়নি।", background_alerts_enabled:"ব্যাকগ্রাউন্ড আবহাওয়া সতর্কতা এখন সক্রিয় করা হয়েছে।", unable_enable_notifications:"ব্যাকগ্রাউন্ড বিজ্ঞপ্তি সক্রিয় করা সম্ভব হয়নি।", notification_status:"বিজ্ঞপ্তির অবস্থা", try_again:"আবার চেষ্টা করুন", smart_alerts_enabled:"স্মার্ট সতর্কতা সক্রিয় করা হয়েছে", background_push_enabled:"ব্যাকগ্রাউন্ড পুশ সক্রিয় করা হয়েছে। এই ট্যাব বন্ধ থাকলেও সতর্কতা আসতে পারে।", weather_alerts_off:"আবহাওয়া সতর্কতা বন্ধ আছে", enable_browser_notifications:"গুরুত্বপূর্ণ আবহাওয়া সতর্কতা পেতে ব্রাউজার বিজ্ঞপ্তি সক্রিয় করুন।", agriculture_advisory_unavailable:"কৃষি পরামর্শ উপলব্ধ নেই।", urban_advisory_unavailable:"শহর সম্পর্কিত পরামর্শ উপলব্ধ নেই।", aviation_advisory_unavailable:"বিমান চলাচল পরামর্শ উপলব্ধ নেই।", marine_advisory_unavailable:"সামুদ্রিক পরামর্শ উপলব্ধ নেই।", disaster_intelligence_unavailable:"দুর্যোগ তথ্য উপলব্ধ নেই।", location_not_available_load_weather:"অবস্থান এখনো উপলব্ধ নেই। প্রথমে আবহাওয়া লোড করুন।", analyzing_marine_conditions:"সামুদ্রিক পরিস্থিতি বিশ্লেষণ করা হচ্ছে...", analyzing_aviation_conditions:"বিমান চলাচলের আবহাওয়া পরিস্থিতি বিশ্লেষণ করা হচ্ছে...", unable_generate_marine_advisory:"সামুদ্রিক পরামর্শ তৈরি করা সম্ভব হয়নি।", unable_generate_urban_advisory:"শহর সম্পর্কিত পরামর্শ তৈরি করা সম্ভব হয়নি।", unable_generate_aviation_advisory:"বিমান চলাচল পরামর্শ তৈরি করা সম্ভব হয়নি।", weather_signal_unavailable:"আবহাওয়ার সংকেত উপলব্ধ নেই।", weather_intelligence_unavailable:"আবহাওয়া বিশ্লেষণ ব্যবস্থা উপলব্ধ নেই।", analysis_ready_wrf_unavailable:"বিশ্লেষণ প্রস্তুত। WRF উপলব্ধ নেই।", analysis_ready_models_compared:"বিশ্লেষণ প্রস্তুত। উপলব্ধ পূর্বাভাস মডেলগুলো তুলনা করা হয়েছে।", unable_load_weather_intelligence:"আবহাওয়া বিশ্লেষণ ব্যবস্থা লোড করা সম্ভব হয়নি।", weather_intelligence_load_failed:"আবহাওয়া বিশ্লেষণ ব্যবস্থা লোড করা যায়নি।", building_unified_early_warnings:"সমন্বিত পূর্ব সতর্কতা তৈরি করা হচ্ছে...", smart_alerts_unavailable:"স্মার্ট সতর্কতা উপলব্ধ নেই।", no_active_smart_alerts:"এই অবস্থানের জন্য কোনো সক্রিয় স্মার্ট সতর্কতা নেই।", high_priority_conditions:"উচ্চ-অগ্রাধিকারযুক্ত পরিস্থিতি সনাক্ত হয়েছে। সুরক্ষা সংক্রান্ত সিদ্ধান্ত নেওয়ার আগে সরকারি সতর্কতা দেখুন।", alert_assessment_complete:"সতর্কতা মূল্যায়ন সম্পন্ন হয়েছে।", unable_load_smart_alerts:"স্মার্ট সতর্কতা লোড করা সম্ভব হয়নি।", smart_alerts_load_failed:"স্মার্ট সতর্কতা লোড করা যায়নি।", unavailable:"অনুপলব্ধ", good:"ভালো", moderate:"মাঝারি", low:"কম", high:"উচ্চ", very_high:"অত্যন্ত উচ্চ", extreme:"চরম", hazardous:"ক্ষতিকর", unhealthy_sensitive:"সংবেদনশীল গোষ্ঠীর জন্য অস্বাস্থ্যকর", unhealthy:"অস্বাস্থ্যকর", very_unhealthy:"অত্যন্ত অস্বাস্থ্যকর", aqi_data_unavailable:"AQI তথ্য উপলব্ধ নেই।", aqi_good:"বায়ুর মান ভালো।", aqi_moderate:"বায়ুর মান গ্রহণযোগ্য, তবে সংবেদনশীল গোষ্ঠীর জন্য কিছুটা উদ্বেগজনক।", aqi_unhealthy_sensitive:"সংবেদনশীল গোষ্ঠীর স্বাস্থ্যে প্রভাব পড়তে পারে।", aqi_unhealthy:"কিছু মানুষ স্বাস্থ্য সমস্যার সম্মুখীন হতে পারেন।", aqi_very_unhealthy:"স্বাস্থ্য সতর্কতা: সবার উপর তীব্র প্রভাব পড়তে পারে।", aqi_hazardous:"স্বাস্থ্য জরুরি পরিস্থিতি সবাইকে প্রভাবিত করতে পারে।", uv_data_unavailable:"UV তথ্য উপলব্ধ নেই।", uv_low:"UV ঝুঁকি কম।", uv_moderate:"UV ঝুঁকি মাঝারি। সুরক্ষা প্রয়োজন হতে পারে।", uv_high:"UV ঝুঁকি উচ্চ। সুরক্ষা নেওয়ার পরামর্শ দেওয়া হচ্ছে।", uv_very_high:"UV ঝুঁকি অত্যন্ত উচ্চ। অতিরিক্ত সুরক্ষা নেওয়ার পরামর্শ দেওয়া হচ্ছে।", uv_extreme:"UV ঝুঁকি চরম। দীর্ঘ সময় সরাসরি সূর্যের আলোতে থাকা এড়িয়ে চলুন।", unable_load_weather_data:"লাইভ আবহাওয়ার তথ্য লোড করা সম্ভব হয়নি।", forecast_unavailable:"পূর্বাভাস উপলব্ধ নেই।", forecast_24h_unavailable:"২৪ ঘণ্টার পূর্বাভাস উপলব্ধ নেই।" },
    brx: { new_chat:"गोदान चाट", quick_access:"खुरांथाइ हाबि", todays_weather:"दिनैनि हाबा", ask_weather:"WeatherGPT खौ हाबानि सोमोन्दै सों...", loading:"लोड जाबाय...", refresh:"फिन लोड", analyze:"थाखाय", generate_advisory:"राय दांनो", current_weather:"दानाय हाबा", humidity:"सिथाय", wind:"हावा", rain:"सान्द्र", air_quality:"हाबा गुण", uv_index:"UV इंडेक्स", weather_alerts:"हाबा सन्देश", forecast_24h:"२४ घण्टानि हाबा अंदाज", forecast_7d:"७ सानि हाबा अंदाज", weather_map:"हाबा नक्शा", saved_locations:"सेभ खालामनाय जायगा", settings:"सेटिङ", language:"राव", weather_report:"हाबा रिपोर्ट", agriculture_advisory:"खामानि राय", aviation_advisory:"हाबा-फुरायगिरि राय", marine_advisory:"समुद्र राय", urban_advisory:"नोगोर / स्मार्ट सिटी", disaster_intelligence:"दुर्योग जानकारी", flood_cyclone:"बाढ़ आरो साइक्लोन सन्देश" },
    doi: { new_chat:"नमीं चैट", quick_access:"त्वरित पहुंच", todays_weather:"अज्ज दा मौसम", ask_weather:"WeatherGPT कन्नै मौसम बारै पुच्छो...", loading:"लोड होआ करदा ऐ...", refresh:"रिफ्रेश", analyze:"विश्लेषण करो", generate_advisory:"सलाह बनाओ", current_weather:"मौजूदा मौसम", humidity:"नमी", wind:"हवा", rain:"बरखा", air_quality:"हवा दी गुणवत्ता", uv_index:"UV सूचकांक", weather_alerts:"मौसम चेतावनी", forecast_24h:"२४ घंटे दा पूर्वानुमान", forecast_7d:"७ दिन दा पूर्वानुमान", weather_map:"मौसम नक्शा", saved_locations:"सहेजे दे थाहर", settings:"सेटिंगां", language:"भाशा", weather_report:"मौसम रिपोर्ट", agriculture_advisory:"कृषि सलाह", aviation_advisory:"हवाई सलाह", marine_advisory:"समुद्री सलाह", urban_advisory:"शहरी / स्मार्ट सिटी", disaster_intelligence:"आपदा जानकारी", flood_cyclone:"बाढ़ ते चक्रवात चेतावनी" },
    gu: { new_chat:"નવી ચેટ", quick_access:"ઝડપી ઍક્સેસ", todays_weather:"આજનું હવામાન", ask_weather:"WeatherGPTને હવામાન વિશે પૂછો...", loading:"લોડ થઈ રહ્યું છે...", refresh:"રિફ્રેશ", analyze:"વિશ્લેષણ કરો", generate_advisory:"સલાહ બનાવો", current_weather:"વર્તમાન હવામાન", humidity:"ભેજ", wind:"પવન", rain:"વરસાદ", air_quality:"હવાની ગુણવત્તા", uv_index:"UV સૂચકાંક", weather_alerts:"હવામાન ચેતવણીઓ", forecast_24h:"૨૪ કલાકનું પૂર્વાનુમાન", forecast_7d:"૭ દિવસનું પૂર્વાનુમાન", weather_map:"ઇન્ટરેક્ટિવ હવામાન નકશો", saved_locations:"સાચવેલા સ્થળો", settings:"સેટિંગ્સ", language:"ભાષા", weather_report:"હવામાન રિપોર્ટ", agriculture_advisory:"કૃષિ સલાહ", aviation_advisory:"વિમાન સલાહ", marine_advisory:"દરિયાઈ સલાહ", urban_advisory:"શહેરી / સ્માર્ટ સિટી", disaster_intelligence:"આપત્તિ માહિતી", flood_cyclone:"પૂર અને વાવાઝોડાની ચેતવણીઓ" },
    kn: { new_chat:"ಹೊಸ ಚಾಟ್", quick_access:"ತ್ವರಿತ ಪ್ರವೇಶ", todays_weather:"ಇಂದಿನ ಹವಾಮಾನ", ask_weather:"WeatherGPTಗೆ ಹವಾಮಾನದ ಬಗ್ಗೆ ಕೇಳಿ...", loading:"ಲೋಡ್ ಆಗುತ್ತಿದೆ...", refresh:"ರಿಫ್ರೆಶ್", analyze:"ವಿಶ್ಲೇಷಿಸಿ", generate_advisory:"ಸಲಹೆ ರಚಿಸಿ", current_weather:"ಪ್ರಸ್ತುತ ಹವಾಮಾನ", humidity:"ಆರ್ದ್ರತೆ", wind:"ಗಾಳಿ", rain:"ಮಳೆ", air_quality:"ಗಾಳಿಯ ಗುಣಮಟ್ಟ", uv_index:"UV ಸೂಚ್ಯಂಕ", weather_alerts:"ಹವಾಮಾನ ಎಚ್ಚರಿಕೆಗಳು", forecast_24h:"೨೪ ಗಂಟೆಗಳ ಮುನ್ಸೂಚನೆ", forecast_7d:"೭ ದಿನಗಳ ಮುನ್ಸೂಚನೆ", weather_map:"ಇಂಟರಾಕ್ಟಿವ್ ಹವಾಮಾನ ನಕ್ಷೆ", saved_locations:"ಉಳಿಸಿದ ಸ್ಥಳಗಳು", settings:"ಸೆಟ್ಟಿಂಗ್‌ಗಳು", language:"ಭಾಷೆ", weather_report:"ಹವಾಮಾನ ವರದಿ", agriculture_advisory:"ಕೃಷಿ ಸಲಹೆ", aviation_advisory:"ವಿಮಾನಯಾನ ಸಲಹೆ", marine_advisory:"ಸಮುದ್ರ ಸಲಹೆ", urban_advisory:"ನಗರ / ಸ್ಮಾರ್ಟ್ ಸಿಟಿ", disaster_intelligence:"ವಿಪತ್ತು ಮಾಹಿತಿ", flood_cyclone:"ನೆರೆ ಮತ್ತು ಚಂಡಮಾರುತ ಎಚ್ಚರಿಕೆಗಳು" },
    ks: { new_chat:"نٔو چیٹ", quick_access:"فوری رسٲی", todays_weather:"آجُک موسم", ask_weather:"WeatherGPT سۭتۍ موسم متعلق پرٛژھیو...", loading:"لوڈ گژھان...", refresh:"ریفرش", analyze:"تجزیہ کرو", generate_advisory:"مشورہ بنٲویو", current_weather:"موجودہ موسم", humidity:"نمی", wind:"ہوا", rain:"بارش", air_quality:"ہواچ معیار", uv_index:"UV اشاریہ", weather_alerts:"موسم انتباہات", forecast_24h:"۲۴ گنٹن ہنٛز پیشن گوئی", forecast_7d:"۷ دۄہن ہنٛز پیشن گوئی", weather_map:"موسم نقشہ", saved_locations:"محفوظ جاے", settings:"سیٹنگز", language:"زبان", weather_report:"موسم رپورٹ", agriculture_advisory:"زرعی مشورہ", aviation_advisory:"ہوابازی مشورہ", marine_advisory:"سمندری مشورہ", urban_advisory:"شہری / سمارٹ سٹی", disaster_intelligence:"آفت متعلق معلومات", flood_cyclone:"سیلاب تہِ طوفان انتباہات" },
    kok: { new_chat:"नवी चॅट", quick_access:"जलद प्रवेश", todays_weather:"आयजाचें हवामान", ask_weather:"WeatherGPT कडेन हवामान विशीं विचारात...", loading:"लोड जाता...", refresh:"रिफ्रेश", analyze:"विश्लेषण करात", generate_advisory:"सल्लो तयार करात", current_weather:"सद्याचें हवामान", humidity:"आर्द्रता", wind:"वाऱो", rain:"पावस", air_quality:"हवेची गुणवत्ता", uv_index:"UV निर्देशांक", weather_alerts:"हवामान इशारे", forecast_24h:"२४ तासांचें अंदाज", forecast_7d:"७ दिसांचें अंदाज", weather_map:"इंटरॅक्टिव्ह हवामान नकाशो", saved_locations:"जतन केल्ले जागे", settings:"सेटिंग्स", language:"भास", weather_report:"हवामान अहवाल", agriculture_advisory:"शेती सल्लो", aviation_advisory:"विमान वाहतूक सल्लो", marine_advisory:"समुद्री सल्लो", urban_advisory:"शेहरी / स्मार्ट सिटी", disaster_intelligence:"आपत्ती माहिती", flood_cyclone:"पूर आनी चक्रीवादळ इशारे" },
    mai: { new_chat:"नव चैट", quick_access:"त्वरित पहुँच", todays_weather:"आइक मौसम", ask_weather:"WeatherGPT सँ मौसमक बारे मे पूछू...", loading:"लोड भ रहल अछि...", refresh:"रिफ्रेश", analyze:"विश्लेषण करू", generate_advisory:"सलाह बनाउ", current_weather:"वर्तमान मौसम", humidity:"आर्द्रता", wind:"हवा", rain:"वर्षा", air_quality:"वायु गुणवत्ता", uv_index:"UV सूचकांक", weather_alerts:"मौसम चेतावनी", forecast_24h:"२४ घंटाक पूर्वानुमान", forecast_7d:"७ दिनक पूर्वानुमान", weather_map:"इंटरैक्टिव मौसम मानचित्र", saved_locations:"सहेजल स्थान", settings:"सेटिंग", language:"भाषा", weather_report:"मौसम रिपोर्ट", agriculture_advisory:"कृषि सलाह", aviation_advisory:"विमानन सलाह", marine_advisory:"समुद्री सलाह", urban_advisory:"शहरी / स्मार्ट सिटी", disaster_intelligence:"आपदा जानकारी", flood_cyclone:"बाढ़ आ चक्रवात चेतावनी" },
    ml: { new_chat:"പുതിയ ചാറ്റ്", quick_access:"ദ്രുത പ്രവേശനം", todays_weather:"ഇന്നത്തെ കാലാവസ്ഥ", ask_weather:"WeatherGPT-യോട് കാലാവസ്ഥയെ കുറിച്ച് ചോദിക്കൂ...", loading:"ലോഡ് ചെയ്യുന്നു...", refresh:"റിഫ്രഷ്", analyze:"വിശകലനം ചെയ്യുക", generate_advisory:"ഉപദേശം സൃഷ്ടിക്കുക", current_weather:"നിലവിലെ കാലാവസ്ഥ", humidity:"ആർദ്രത", wind:"കാറ്റ്", rain:"മഴ", air_quality:"വായു ഗുണനിലവാരം", uv_index:"UV സൂചിക", weather_alerts:"കാലാവസ്ഥ മുന്നറിയിപ്പുകൾ", forecast_24h:"24 മണിക്കൂർ പ്രവചനം", forecast_7d:"7 ദിവസത്തെ പ്രവചനം", weather_map:"ഇന്ററാക്ടീവ് കാലാവസ്ഥാ മാപ്പ്", saved_locations:"സംരക്ഷിച്ച സ്ഥലങ്ങൾ", settings:"ക്രമീകരണങ്ങൾ", language:"ഭാഷ", weather_report:"കാലാവസ്ഥാ റിപ്പോർട്ട്", agriculture_advisory:"കാർഷിക ഉപദേശം", aviation_advisory:"വിമാനയാന ഉപദേശം", marine_advisory:"സമുദ്ര ഉപദേശം", urban_advisory:"നഗരം / സ്മാർട്ട് സിറ്റി", disaster_intelligence:"ദുരന്ത വിവരങ്ങൾ", flood_cyclone:"പ്രളയവും ചുഴലിക്കാറ്റും മുന്നറിയിപ്പുകൾ" },
    mni: { new_chat:"অঙবা চ্যাট", quick_access:"চাংশিনবা", todays_weather:"নুংশিতগী নুংশিত", ask_weather:"WeatherGPT দা নুংশিতগী মরমদা হংবিয়ু...", loading:"লোড তৌরী...", refresh:"রিফ্রেশ", analyze:"শান্নবা", generate_advisory:"পামজিন থোকপা", current_weather:"খুদক্তা লৈরিবা নুংশিত", humidity:"মমল", wind:"মমাং", rain:"ইশিং", air_quality:"ইশিংগী মপান", uv_index:"UV সূচক", weather_alerts:"নুংশিত সতর্কতা", forecast_24h:"২৪ ঘণ্টাগী নুংশিত", forecast_7d:"৭ নুমিতগী নুংশিত", weather_map:"নুংশিত ম্যাপ", saved_locations:"থাদ্রবা মফম", settings:"সেটিং", language:"লৈমিং", weather_report:"নুংশিত রিপোর্ট", agriculture_advisory:"কৃষি উপদেশ", aviation_advisory:"এভিয়েশন উপদেশ", marine_advisory:"মেরিন উপদেশ", urban_advisory:"আরবান / স্মার্ট সিটি", disaster_intelligence:"দুর্যোগ তথ্য", flood_cyclone:"বন্যা আর ঘূর্ণিঝড় সতর্কতা" },
    mr: { new_chat:"नवीन चॅट", quick_access:"जलद प्रवेश", todays_weather:"आजचे हवामान", ask_weather:"WeatherGPT ला हवामानाबद्दल विचारा...", loading:"लोड होत आहे...", refresh:"रिफ्रेश", analyze:"विश्लेषण करा", generate_advisory:"सल्ला तयार करा", current_weather:"सध्याचे हवामान", humidity:"आर्द्रता", wind:"वारा", rain:"पाऊस", air_quality:"हवेची गुणवत्ता", uv_index:"UV निर्देशांक", weather_alerts:"हवामान इशारे", forecast_24h:"२४ तासांचा अंदाज", forecast_7d:"७ दिवसांचा अंदाज", weather_map:"परस्परसंवादी हवामान नकाशा", saved_locations:"जतन केलेली ठिकाणे", settings:"सेटिंग्ज", language:"भाषा", weather_report:"हवामान अहवाल", agriculture_advisory:"कृषी सल्ला", aviation_advisory:"विमान वाहतूक सल्ला", marine_advisory:"सागरी सल्ला", urban_advisory:"शहरी / स्मार्ट सिटी", disaster_intelligence:"आपत्ती माहिती", flood_cyclone:"पूर आणि चक्रीवादळ इशारे" },
    ne: { new_chat:"नयाँ च्याट", quick_access:"द्रुत पहुँच", todays_weather:"आजको मौसम", ask_weather:"WeatherGPT लाई मौसमबारे सोध्नुहोस्...", loading:"लोड हुँदैछ...", refresh:"रिफ्रेस", analyze:"विश्लेषण गर्नुहोस्", generate_advisory:"सल्लाह तयार गर्नुहोस्", current_weather:"हालको मौसम", humidity:"आर्द्रता", wind:"हावा", rain:"वर्षा", air_quality:"वायु गुणस्तर", uv_index:"UV सूचकांक", weather_alerts:"मौसम चेतावनी", forecast_24h:"२४ घण्टाको पूर्वानुमान", forecast_7d:"७ दिनको पूर्वानुमान", weather_map:"इन्टरएक्टिभ मौसम नक्सा", saved_locations:"सुरक्षित स्थानहरू", settings:"सेटिङहरू", language:"भाषा", weather_report:"मौसम प्रतिवेदन", agriculture_advisory:"कृषि सल्लाह", aviation_advisory:"विमान सल्लाह", marine_advisory:"समुद्री सल्लाह", urban_advisory:"शहरी / स्मार्ट सिटी", disaster_intelligence:"विपद् जानकारी", flood_cyclone:"बाढी र चक्रवात चेतावनी" },
    or: { new_chat:"ନୂଆ ଚାଟ୍", quick_access:"ଦ୍ରୁତ ପ୍ରବେଶ", todays_weather:"ଆଜିର ପାଣିପାଗ", ask_weather:"WeatherGPT କୁ ପାଣିପାଗ ବିଷୟରେ ପଚାରନ୍ତୁ...", loading:"ଲୋଡ୍ ହେଉଛି...", refresh:"ରିଫ୍ରେଶ୍", analyze:"ବିଶ୍ଳେଷଣ କରନ୍ତୁ", generate_advisory:"ପରାମର୍ଶ ତିଆରି କରନ୍ତୁ", current_weather:"ବର୍ତ୍ତମାନ ପାଣିପାଗ", humidity:"ଆର୍ଦ୍ରତା", wind:"ପବନ", rain:"ବର୍ଷା", air_quality:"ବାୟୁ ଗୁଣବତ୍ତା", uv_index:"UV ସୂଚକ", weather_alerts:"ପାଣିପାଗ ସତର୍କତା", forecast_24h:"୨୪ ଘଣ୍ଟା ପୂର୍ବାନୁମାନ", forecast_7d:"୭ ଦିନର ପୂର୍ବାନୁମାନ", weather_map:"ଇଣ୍ଟରାକ୍ଟିଭ୍ ପାଣିପାଗ ମାନଚିତ୍ର", saved_locations:"ସଂରକ୍ଷିତ ସ୍ଥାନ", settings:"ସେଟିଂସ୍", language:"ଭାଷା", weather_report:"ପାଣିପାଗ ରିପୋର୍ଟ", agriculture_advisory:"କୃଷି ପରାମର୍ଶ", aviation_advisory:"ବିମାନ ପରାମର୍ଶ", marine_advisory:"ସାମୁଦ୍ରିକ ପରାମର୍ଶ", urban_advisory:"ସହର / ସ୍ମାର୍ଟ ସିଟି", disaster_intelligence:"ଦୁର୍ଘଟଣା ସୂଚନା", flood_cyclone:"ବନ୍ୟା ଏବଂ ବାତ୍ୟା ସତର୍କତା" },
    pa: { new_chat:"ਨਵੀਂ ਚੈਟ", quick_access:"ਤੁਰੰਤ ਪਹੁੰਚ", todays_weather:"ਅੱਜ ਦਾ ਮੌਸਮ", ask_weather:"WeatherGPT ਨੂੰ ਮੌਸਮ ਬਾਰੇ ਪੁੱਛੋ...", loading:"ਲੋਡ ਹੋ ਰਿਹਾ ਹੈ...", refresh:"ਰਿਫ੍ਰੈਸ਼", analyze:"ਵਿਸ਼ਲੇਸ਼ਣ ਕਰੋ", generate_advisory:"ਸਲਾਹ ਬਣਾਓ", current_weather:"ਮੌਜੂਦਾ ਮੌਸਮ", humidity:"ਨਮੀ", wind:"ਹਵਾ", rain:"ਮੀਂਹ", air_quality:"ਹਵਾ ਦੀ ਗੁਣਵੱਤਾ", uv_index:"UV ਸੂਚਕ", weather_alerts:"ਮੌਸਮ ਚੇਤਾਵਨੀਆਂ", forecast_24h:"24 ਘੰਟਿਆਂ ਦੀ ਭਵਿੱਖਬਾਣੀ", forecast_7d:"7 ਦਿਨਾਂ ਦੀ ਭਵਿੱਖਬਾਣੀ", weather_map:"ਇੰਟਰਐਕਟਿਵ ਮੌਸਮ ਨਕਸ਼ਾ", saved_locations:"ਸੁਰੱਖਿਅਤ ਸਥਾਨ", settings:"ਸੈਟਿੰਗਾਂ", language:"ਭਾਸ਼ਾ", weather_report:"ਮੌਸਮ ਰਿਪੋਰਟ", agriculture_advisory:"ਖੇਤੀਬਾੜੀ ਸਲਾਹ", aviation_advisory:"ਹਵਾਈ ਸਲਾਹ", marine_advisory:"ਸਮੁੰਦਰੀ ਸਲਾਹ", urban_advisory:"ਸ਼ਹਿਰੀ / ਸਮਾਰਟ ਸਿਟੀ", disaster_intelligence:"ਆਫ਼ਤ ਜਾਣਕਾਰੀ", flood_cyclone:"ਹੜ੍ਹ ਅਤੇ ਚੱਕਰਵਾਤ ਚੇਤਾਵਨੀਆਂ" },
    sa: { new_chat:"नूतनसंवादः", quick_access:"शीघ्रप्रवेशः", todays_weather:"अद्यतनं मौसमम्", ask_weather:"WeatherGPT इत्यस्मै मौसमविषये पृच्छतु...", loading:"लोड् भवति...", refresh:"पुनःप्रारम्भः", analyze:"विश्लेषणं कुरुत", generate_advisory:"परामर्शं निर्मातु", current_weather:"वर्तमानं मौसमम्", humidity:"आर्द्रता", wind:"वायुः", rain:"वृष्टिः", air_quality:"वायुगुणवत्ता", uv_index:"UV सूचकाङ्कः", weather_alerts:"मौसमसूचनाः", forecast_24h:"चतुर्विंशतिघण्टापूर्वानुमानम्", forecast_7d:"सप्तदिनपूर्वानुमानम्", weather_map:"मौसममानचित्रम्", saved_locations:"संगृहीतस्थानानि", settings:"विन्यासाः", language:"भाषा", weather_report:"मौसमप्रतिवेदनम्", agriculture_advisory:"कृषिपरामर्शः", aviation_advisory:"विमानपरामर्शः", marine_advisory:"समुद्रपरामर्शः", urban_advisory:"नगर / स्मार्टसिटी", disaster_intelligence:"आपत्तिसूचना", flood_cyclone:"पूरचक्रवातसूचनाः" },
    sat: { new_chat:"ᱱᱟᱣᱟ ᱪᱟᱴ", quick_access:"ᱥᱟᱦᱟᱡ ᱦᱟᱹᱴ", todays_weather:"ᱛᱮᱦᱮᱧ ᱦᱟᱣᱟ", ask_weather:"WeatherGPT ᱠᱚ ᱦᱟᱣᱟ ᱵᱟᱵᱚᱛ ᱥᱚᱫᱚᱨ ᱢᱮ...", loading:"ᱞᱳᱰ ᱦᱚᱪᱚ ᱟ...", refresh:"ᱨᱤᱯᱷᱨᱮᱥ", analyze:"ᱵᱤᱥᱞᱮᱥᱚᱱ ᱢᱮ", generate_advisory:"ᱥᱟᱞᱟᱦ ᱛᱮᱭᱟᱨ ᱢᱮ", current_weather:"ᱱᱤᱛᱚᱜ ᱦᱟᱣᱟ", humidity:"ᱥᱤᱛᱟᱹ", wind:"ᱦᱟᱣᱟ", rain:"ᱥᱤᱫᱟᱹ", air_quality:"ᱦᱟᱣᱟ ᱜᱩᱱ", uv_index:"UV ᱥᱩᱪᱠ", weather_alerts:"ᱦᱟᱣᱟ ᱥᱟᱵᱽᱦᱟᱹᱱ", forecast_24h:"24 ᱜᱷᱚᱱᱴᱟ ᱥᱟᱹᱠᱷᱟᱛ", forecast_7d:"7 ᱢᱟᱦ ᱥᱟᱹᱠᱷᱟᱛ", weather_map:"ᱦᱟᱣᱟ ᱱᱟᱠᱷᱟ", saved_locations:"ᱥᱟᱢᱠᱟᱹᱢ ᱡᱟᱭᱜᱟ", settings:"ᱥᱮᱴᱤᱝ", language:"ᱯᱟᱹᱨᱥᱤ", weather_report:"ᱦᱟᱣᱟ ᱨᱤᱯᱚᱨᱴ", agriculture_advisory:"ᱪᱟᱥ ᱥᱟᱞᱟᱦ", aviation_advisory:"ᱯᱟᱹᱭᱞᱚᱴ ᱥᱟᱞᱟᱦ", marine_advisory:"ᱥᱚᱢᱩᱫᱽᱨ ᱥᱟᱞᱟᱦ", urban_advisory:"ᱥᱚᱦᱚᱨ / ᱥᱢᱟᱨᱴ ᱥᱤᱴᱤ", disaster_intelligence:"ᱫᱩᱨᱵᱚᱲ ᱡᱟᱱᱠᱟᱹᱨᱤ", flood_cyclone:"ᱫᱟᱜ ᱵᱟᱹᱲ ᱟᱨ ᱪᱟᱠᱨᱚᱣᱟᱛ ᱥᱟᱵᱽᱦᱟᱹᱱ" },
    sd: { new_chat:"نئين چيٽ", quick_access:"جلدي پهچ", todays_weather:"اڄ جو موسم", ask_weather:"WeatherGPT کان موسم بابت پڇو...", loading:"لوڊ ٿي رهيو آهي...", refresh:"ريفريش", analyze:"تجزيو ڪريو", generate_advisory:"صلاح ٺاهيو", current_weather:"موجوده موسم", humidity:"نمي", wind:"هوا", rain:"مينهن", air_quality:"هوا جو معيار", uv_index:"UV انڊيڪس", weather_alerts:"موسمي خبرداريون", forecast_24h:"24 ڪلاڪن جي اڳڪٿي", forecast_7d:"7 ڏينهن جي اڳڪٿي", weather_map:"موسم جو نقشو", saved_locations:"محفوظ جڳهيون", settings:"سيٽنگون", language:"ٻولي", weather_report:"موسم رپورٽ", agriculture_advisory:"زرعي صلاح", aviation_advisory:"هوائي صلاح", marine_advisory:"سامونڊي صلاح", urban_advisory:"شهري / اسمارٽ سٽي", disaster_intelligence:"آفت جي ڄاڻ", flood_cyclone:"ٻوڏ ۽ طوفان جون خبرداريون" },
    ta: { new_chat:"புதிய அரட்டை", quick_access:"விரைவு அணுகல்", todays_weather:"இன்றைய வானிலை", ask_weather:"WeatherGPT-யிடம் வானிலை பற்றி கேளுங்கள்...", loading:"ஏற்றப்படுகிறது...", refresh:"புதுப்பிக்கவும்", analyze:"பகுப்பாய்வு செய்யவும்", generate_advisory:"ஆலோசனையை உருவாக்கவும்", current_weather:"தற்போதைய வானிலை", humidity:"ஈரப்பதம்", wind:"காற்று", rain:"மழை", air_quality:"காற்றின் தரம்", uv_index:"UV குறியீடு", weather_alerts:"வானிலை எச்சரிக்கைகள்", forecast_24h:"24 மணி நேர முன்னறிவிப்பு", forecast_7d:"7 நாள் முன்னறிவிப்பு", weather_map:"ஊடாடும் வானிலை வரைபடம்", saved_locations:"சேமித்த இடங்கள்", settings:"அமைப்புகள்", language:"மொழி", weather_report:"வானிலை அறிக்கை", agriculture_advisory:"விவசாய ஆலோசனை", aviation_advisory:"விமான ஆலோசனை", marine_advisory:"கடல் ஆலோசனை", urban_advisory:"நகர்ப்புற / ஸ்மார்ட் சிட்டி", disaster_intelligence:"பேரிடர் தகவல்", flood_cyclone:"வெள்ளம் மற்றும் புயல் எச்சரிக்கைகள்" },
    te: { new_chat:"కొత్త చాట్", quick_access:"త్వరిత ప్రాప్యత", todays_weather:"ఈరోజు వాతావరణం", ask_weather:"WeatherGPTని వాతావరణం గురించి అడగండి...", loading:"లోడ్ అవుతోంది...", refresh:"రిఫ్రెష్", analyze:"విశ్లేషించండి", generate_advisory:"సలహా రూపొందించండి", current_weather:"ప్రస్తుత వాతావరణం", humidity:"తేమ", wind:"గాలి", rain:"వర్షం", air_quality:"గాలి నాణ్యత", uv_index:"UV సూచిక", weather_alerts:"వాతావరణ హెచ్చరికలు", forecast_24h:"24 గంటల అంచనా", forecast_7d:"7 రోజుల అంచనా", weather_map:"ఇంటరాక్టివ్ వాతావరణ మ్యాప్", saved_locations:"సేవ్ చేసిన ప్రదేశాలు", settings:"సెట్టింగ్‌లు", language:"భాష", weather_report:"వాతావరణ నివేదిక", agriculture_advisory:"వ్యవసాయ సలహా", aviation_advisory:"విమానయాన సలహా", marine_advisory:"సముద్ర సలహా", urban_advisory:"పట్టణ / స్మార్ట్ సిటీ", disaster_intelligence:"విపత్తు సమాచారం", flood_cyclone:"వరద మరియు తుఫాను హెచ్చరికలు" },
    ur: { new_chat:"نئی چیٹ", quick_access:"فوری رسائی", todays_weather:"آج کا موسم", ask_weather:"WeatherGPT سے موسم کے بارے میں پوچھیں...", loading:"لوڈ ہو رہا ہے...", refresh:"ریفریش", analyze:"تجزیہ کریں", generate_advisory:"مشورہ بنائیں", current_weather:"موجودہ موسم", humidity:"نمی", wind:"ہوا", rain:"بارش", air_quality:"ہوا کا معیار", uv_index:"UV انڈیکس", weather_alerts:"موسمی انتباہات", forecast_24h:"24 گھنٹے کی پیش گوئی", forecast_7d:"7 دن کی پیش گوئی", weather_map:"انٹرایکٹو موسم کا نقشہ", saved_locations:"محفوظ مقامات", settings:"ترتیبات", language:"زبان", weather_report:"موسم رپورٹ", agriculture_advisory:"زرعی مشورہ", aviation_advisory:"ہوا بازی کا مشورہ", marine_advisory:"سمندری مشورہ", urban_advisory:"شہری / اسمارٹ سٹی", disaster_intelligence:"آفت کی معلومات", flood_cyclone:"سیلاب اور طوفان کے انتباہات" }
};


/* =========================================================
   CORE UI COMPLETION PACKS
   The original extra packs contained only the first 28 labels.
   These additional core labels keep the main dashboard fully localized
   without depending on a runtime translation provider.
   ========================================================= */
const CORE_EXTRA_LANGUAGE_TRANSLATIONS = {
 as:{about_weathergpt:"WeatherGPT ৰ বিষয়ে",accuracy_performance:"সঠিকতা আৰু কাৰ্যক্ষমতা",ai_recommendations:"AI পৰামৰ্শ",air_quality_uv:"বায়ুৰ গুণগত মান আৰু UV",alerts_safety:"সতৰ্কতা আৰু সুৰক্ষা",back_to_chat:"চেটলৈ উভতি যাওক",climate_history:"জলবায়ু আৰু ইতিহাস",detailed_precipitation:"বিশদ বৰষুণ",detecting_location:"অৱস্থান চিনাক্ত কৰা হৈছে",environment_map:"পৰিৱেশ আৰু মানচিত্ৰ",forecast_trends:"পূৰ্বানুমান আৰু প্ৰৱণতা",more_information:"অধিক তথ্য",no_recent_chats:"শেহতীয়া কোনো চেট নাই",no_saved_locations:"সংৰক্ষিত কোনো স্থান নাই",nwp_gfs:"NWP / GFS মডেল",rain_forecast:"বৰষুণৰ পূৰ্বানুমান",recent_chats:"শেহতীয়া চেট",report:"প্ৰতিবেদন",search_location:"চহৰ, গাঁও বা এলেকা বিচাৰক...",sector_advisory:"খণ্ডভিত্তিক পৰামৰ্শ",sign_in:"ছাইন ইন কৰক",smart_early_warnings:"স্মাৰ্ট আগতীয়া সতৰ্কতা",smart_notifications:"স্মাৰ্ট জাননী",temperature:"উষ্ণতা",weather_data_appear:"বতৰৰ তথ্য ইয়াত দেখা যাব।",weather_insights:"বতৰৰ তথ্য বিশ্লেষণ",weather_intelligence:"বতৰ বুদ্ধিমত্তা",weather_trends:"বতৰৰ প্ৰৱণতা",your_ai_weather_assistant:"আপোনাৰ AI-চালিত বতৰ সহায়ক",your_location:"আপোনাৰ অৱস্থান"},
 brx:{about_weathergpt:"WeatherGPT नि सोमोन्दै",accuracy_performance:"गोरोब आरो मावफुंनाय",ai_recommendations:"AI राय",air_quality_uv:"हाबा गुण आरो UV",alerts_safety:"सन्देश आरो रैखा",back_to_chat:"चाटाव सोलों",climate_history:"जलवायु आरो जारिमिन",detailed_precipitation:"गुवार बरसुन",detecting_location:"जायगा नागिरनाय",environment_map:"परिबेश आरो नक्शा",forecast_trends:"अंदाज आरो थानाय",more_information:"बांद्राय जानकारी",no_recent_chats:"गोदान चाट गैया",no_saved_locations:"सेभ खालामनाय जायगा गैया",nwp_gfs:"NWP / GFS मोडेल",rain_forecast:"बरसुन अंदाज",recent_chats:"गोदान चाट",report:"रिपोर्ट",search_location:"नगर, गामि एबा जायगा नागिर",sector_advisory:"खाति राय",sign_in:"साइन इन खालाम",smart_early_warnings:"स्मार्ट गुदि सन्देश",smart_notifications:"स्मार्ट नोटिफिकेसन",temperature:"सोमो",weather_data_appear:"हाबानि जानकारी बेयाव नुजागोन।",weather_insights:"हाबा जानकारी विश्लेषण",weather_intelligence:"हाबा बुदिमत्ता",weather_trends:"हाबा थानाय",your_ai_weather_assistant:"नोंनि AI हाबा सहायक",your_location:"नोंनि जायगा"},
 doi:{about_weathergpt:"WeatherGPT बारे",accuracy_performance:"सटीकता ते कारगुजारी",ai_recommendations:"AI सलाह",air_quality_uv:"हवा दी गुणवत्ता ते UV",alerts_safety:"चेतावनी ते सुरक्षा",back_to_chat:"चैट च वापस जाओ",climate_history:"जलवायु ते इतिहास",detailed_precipitation:"विस्तृत बरखा",detecting_location:"स्थान पता लग्गा करदा",environment_map:"वातावरण ते नक्शा",forecast_trends:"पूर्वानुमान ते रुझान",more_information:"होर जानकारी",no_recent_chats:"कोई हालिया चैट नेई",no_saved_locations:"कोई सहेजे दे थाहर नेई",nwp_gfs:"NWP / GFS मॉडल",rain_forecast:"बरखा दा पूर्वानुमान",recent_chats:"हालिया चैट",report:"रिपोर्ट",search_location:"शैहर, पिंड जां इलाका खोजो...",sector_advisory:"खेत्र सलाह",sign_in:"साइन इन करो",smart_early_warnings:"स्मार्ट शुरुआती चेतावनी",smart_notifications:"स्मार्ट सूचनां",temperature:"तापमान",weather_data_appear:"मौसम दी जानकारी इत्थे दिस्सू।",weather_insights:"मौसम जानकारी विश्लेषण",weather_intelligence:"मौसम बुद्धिमत्ता",weather_trends:"मौसम दे रुझान",your_ai_weather_assistant:"तुंदा AI मौसम सहायक",your_location:"तुंदा स्थान"},
 gu:{about_weathergpt:"WeatherGPT વિશે",accuracy_performance:"ચોકસાઈ અને કામગીરી",ai_recommendations:"AI ભલામણો",air_quality_uv:"હવાની ગુણવત્તા અને UV",alerts_safety:"ચેતવણીઓ અને સુરક્ષા",back_to_chat:"ચેટ પર પાછા જાઓ",climate_history:"આબોહવા અને ઇતિહાસ",detailed_precipitation:"વિગતવાર વરસાદ",detecting_location:"સ્થાન શોધી રહ્યા છીએ",environment_map:"પર્યાવરણ અને નકશો",forecast_trends:"આગાહી અને વલણો",more_information:"વધુ માહિતી",no_recent_chats:"કોઈ તાજેતરની ચેટ નથી",no_saved_locations:"કોઈ સાચવેલું સ્થાન નથી",nwp_gfs:"NWP / GFS મોડેલ",rain_forecast:"વરસાદની આગાહી",recent_chats:"તાજેતરની ચેટ",report:"રિપોર્ટ",search_location:"શહેર, ગામ અથવા વિસ્તાર શોધો...",sector_advisory:"ક્ષેત્ર સલાહ",sign_in:"સાઇન ઇન કરો",smart_early_warnings:"સ્માર્ટ પ્રારંભિક ચેતવણીઓ",smart_notifications:"સ્માર્ટ સૂચનાઓ",temperature:"તાપમાન",weather_data_appear:"હવામાનની માહિતી અહીં દેખાશે.",weather_insights:"હવામાન માહિતી વિશ્લેષણ",weather_intelligence:"હવામાન બુદ્ધિમત્તા",weather_trends:"હવામાનના વલણો",your_ai_weather_assistant:"તમારો AI આધારિત હવામાન સહાયક",your_location:"તમારું સ્થાન"},
 kn:{about_weathergpt:"WeatherGPT ಬಗ್ಗೆ",accuracy_performance:"ನಿಖರತೆ ಮತ್ತು ಕಾರ್ಯಕ್ಷಮತೆ",ai_recommendations:"AI ಶಿಫಾರಸುಗಳು",air_quality_uv:"ಗಾಳಿಯ ಗುಣಮಟ್ಟ ಮತ್ತು UV",alerts_safety:"ಎಚ್ಚರಿಕೆಗಳು ಮತ್ತು ಸುರಕ್ಷತೆ",back_to_chat:"ಚಾಟ್‌ಗೆ ಹಿಂತಿರುಗಿ",climate_history:"ಹವಾಮಾನ ಮತ್ತು ಇತಿಹಾಸ",detailed_precipitation:"ವಿವರವಾದ ಮಳೆ",detecting_location:"ಸ್ಥಳವನ್ನು ಪತ್ತೆಹಚ್ಚಲಾಗುತ್ತಿದೆ",environment_map:"ಪರಿಸರ ಮತ್ತು ನಕ್ಷೆ",forecast_trends:"ಮುನ್ಸೂಚನೆ ಮತ್ತು ಪ್ರವೃತ್ತಿಗಳು",more_information:"ಹೆಚ್ಚಿನ ಮಾಹಿತಿ",no_recent_chats:"ಇತ್ತೀಚಿನ ಚಾಟ್‌ಗಳಿಲ್ಲ",no_saved_locations:"ಉಳಿಸಿದ ಸ್ಥಳಗಳಿಲ್ಲ",nwp_gfs:"NWP / GFS ಮಾದರಿ",rain_forecast:"ಮಳೆಯ ಮುನ್ಸೂಚನೆ",recent_chats:"ಇತ್ತೀಚಿನ ಚಾಟ್‌ಗಳು",report:"ವರದಿ",search_location:"ನಗರ, ಗ್ರಾಮ ಅಥವಾ ಪ್ರದೇಶವನ್ನು ಹುಡುಕಿ...",sector_advisory:"ವಲಯ ಸಲಹೆ",sign_in:"ಸೈನ್ ಇನ್ ಮಾಡಿ",smart_early_warnings:"ಸ್ಮಾರ್ಟ್ ಮುಂಚಿತ ಎಚ್ಚರಿಕೆಗಳು",smart_notifications:"ಸ್ಮಾರ್ಟ್ ಅಧಿಸೂಚನೆಗಳು",temperature:"ತಾಪಮಾನ",weather_data_appear:"ಹವಾಮಾನ ಮಾಹಿತಿ ಇಲ್ಲಿ ಕಾಣಿಸುತ್ತದೆ.",weather_insights:"ಹವಾಮಾನ ಮಾಹಿತಿ ವಿಶ್ಲೇಷಣೆ",weather_intelligence:"ಹವಾಮಾನ ಬುದ್ಧಿಮತ್ತೆ",weather_trends:"ಹವಾಮಾನ ಪ್ರವೃತ್ತಿಗಳು",your_ai_weather_assistant:"ನಿಮ್ಮ AI ಹವಾಮಾನ ಸಹಾಯಕ",your_location:"ನಿಮ್ಮ ಸ್ಥಳ"},
 ks:{about_weathergpt:"WeatherGPT متعلق",accuracy_performance:"درستگی تہِ کارکردگی",ai_recommendations:"AI مشورٕ",air_quality_uv:"ہواچ معیار تہِ UV",alerts_safety:"انتباہ تہِ حفاظت",back_to_chat:"چیٹ کُن واپس",climate_history:"آب و ہوا تہِ تاریخ",detailed_precipitation:"مکمل بارش",detecting_location:"جاے پتہ لگان",environment_map:"ماحول تہِ نقشہ",forecast_trends:"پیشن گوئی تہِ رجحانات",more_information:"مزید معلومات",no_recent_chats:"کانٛہہ حالیہ چیٹ چھُ نَہ",no_saved_locations:"کانٛہہ محفوظ جاے چھُ نَہ",nwp_gfs:"NWP / GFS ماڈل",rain_forecast:"بارش ہنٛز پیشن گوئی",recent_chats:"حالیہ چیٹ",report:"رپورٹ",search_location:"شہر، گام یا علاقہ ژھارِو...",sector_advisory:"شعبہٕ مشورٕ",sign_in:"سائن اِن کٔرِو",smart_early_warnings:"سمارٹ پیشگی انتباہات",smart_notifications:"سمارٹ اطلاع",temperature:"درجہ حرارت",weather_data_appear:"موسم ہنٛز معلومات یَتھ دِکھاونہٕ یِیہِ۔",weather_insights:"موسم معلومات تجزیہ",weather_intelligence:"موسمی ذہانت",weather_trends:"موسم ہنٛز رجحانات",your_ai_weather_assistant:"تُہند AI موسمی معاون",your_location:"تُہند جاے"},
 kok:{about_weathergpt:"WeatherGPT विशीं",accuracy_performance:"अचूकताय आनी कामगिरी",ai_recommendations:"AI सल्ले",air_quality_uv:"हवेची गुणवत्ता आनी UV",alerts_safety:"इशारे आनी सुरक्षा",back_to_chat:"चॅटाक परत वचात",climate_history:"हवामान आनी इतिहास",detailed_precipitation:"तपशीलवार पावस",detecting_location:"जागो सोदता",environment_map:"पर्यावरण आनी नकाशो",forecast_trends:"अंदाज आनी प्रवाह",more_information:"चड माहिती",no_recent_chats:"नव्या चॅटा नात",no_saved_locations:"जतन केल्ले जागे नात",nwp_gfs:"NWP / GFS मॉडेल",rain_forecast:"पावसाचो अंदाज",recent_chats:"नव्यो चॅट",report:"अहवाल",search_location:"शार, गांव वा भाग सोदात...",sector_advisory:"क्षेत्र सल्लो",sign_in:"साइन इन करात",smart_early_warnings:"स्मार्ट पयलींचे इशारे",smart_notifications:"स्मार्ट सूचना",temperature:"तापमान",weather_data_appear:"हवामानाची माहिती हांगा दिसतली.",weather_insights:"हवामान माहिती विश्लेषण",weather_intelligence:"हवामान बुद्धिमत्ता",weather_trends:"हवामानाचे प्रवाह",your_ai_weather_assistant:"तुमचो AI हवामान सहाय्यक",your_location:"तुमची जागो"},
 mai:{about_weathergpt:"WeatherGPT क परिचय",accuracy_performance:"सटीकता आ प्रदर्शन",ai_recommendations:"AI सिफारिश",air_quality_uv:"वायु गुणवत्ता आ UV",alerts_safety:"चेतावनी आ सुरक्षा",back_to_chat:"चैट पर वापस जाउ",climate_history:"जलवायु आ इतिहास",detailed_precipitation:"विस्तृत वर्षा",detecting_location:"स्थान पता कएल जा रहल अछि",environment_map:"पर्यावरण आ नक्शा",forecast_trends:"पूर्वानुमान आ रुझान",more_information:"बेसी जानकारी",no_recent_chats:"हालक कोनो चैट नहि",no_saved_locations:"कोनो सहेजल स्थान नहि",nwp_gfs:"NWP / GFS मॉडल",rain_forecast:"वर्षा पूर्वानुमान",recent_chats:"हालक चैट",report:"रिपोर्ट",search_location:"शहर, गाम वा क्षेत्र खोजू...",sector_advisory:"क्षेत्रीय सलाह",sign_in:"साइन इन करू",smart_early_warnings:"स्मार्ट प्रारम्भिक चेतावनी",smart_notifications:"स्मार्ट सूचना",temperature:"तापमान",weather_data_appear:"मौसमक जानकारी एतय देखाओल जाएत।",weather_insights:"मौसम जानकारी विश्लेषण",weather_intelligence:"मौसम बुद्धिमत्ता",weather_trends:"मौसमक रुझान",your_ai_weather_assistant:"अहाँक AI मौसम सहायक",your_location:"अहाँक स्थान"},
 ml:{about_weathergpt:"WeatherGPT-നെ കുറിച്ച്",accuracy_performance:"കൃത്യതയും പ്രകടനവും",ai_recommendations:"AI ശുപാർശകൾ",air_quality_uv:"വായു ഗുണനിലവാരവും UV-യും",alerts_safety:"മുന്നറിയിപ്പുകളും സുരക്ഷയും",back_to_chat:"ചാറ്റിലേക്ക് മടങ്ങുക",climate_history:"കാലാവസ്ഥയും ചരിത്രവും",detailed_precipitation:"വിശദമായ മഴ",detecting_location:"സ്ഥാനം കണ്ടെത്തുന്നു",environment_map:"പരിസ്ഥിതിയും മാപ്പും",forecast_trends:"പ്രവചനവും പ്രവണതകളും",more_information:"കൂടുതൽ വിവരങ്ങൾ",no_recent_chats:"സമീപകാല ചാറ്റുകളില്ല",no_saved_locations:"സംരക്ഷിച്ച സ്ഥലങ്ങളില്ല",nwp_gfs:"NWP / GFS മോഡൽ",rain_forecast:"മഴ പ്രവചനം",recent_chats:"സമീപകാല ചാറ്റുകൾ",report:"റിപ്പോർട്ട്",search_location:"നഗരം, ഗ്രാമം അല്ലെങ്കിൽ പ്രദേശം തിരയുക...",sector_advisory:"മേഖലാ ഉപദേശം",sign_in:"സൈൻ ഇൻ ചെയ്യുക",smart_early_warnings:"സ്മാർട്ട് മുൻകൂർ മുന്നറിയിപ്പുകൾ",smart_notifications:"സ്മാർട്ട് അറിയിപ്പുകൾ",temperature:"താപനില",weather_data_appear:"കാലാവസ്ഥാ വിവരങ്ങൾ ഇവിടെ കാണിക്കും.",weather_insights:"കാലാവസ്ഥാ വിവര വിശകലനം",weather_intelligence:"കാലാവസ്ഥാ ബുദ്ധി",weather_trends:"കാലാവസ്ഥാ പ്രവണതകൾ",your_ai_weather_assistant:"നിങ്ങളുടെ AI കാലാവസ്ഥാ സഹായി",your_location:"നിങ്ങളുടെ സ്ഥാനം"},
 mni:{about_weathergpt:"WeatherGPT-গী মতাংদা",accuracy_performance:"অশিংবা অমসুং মায়কাই",ai_recommendations:"AI পামজিনবা",air_quality_uv:"ইশিংগী মপান অমসুং UV",alerts_safety:"সতর্কতা অমসুং ফংজিনবা",back_to_chat:"চ্যাটদা হন্না",climate_history:"জলবায়ু অমসুং ইতিহাস",detailed_precipitation:"অকুপ্পা ইশিংগী চাং",detecting_location:"মফম খংদোকপা",environment_map:"পরিবেশ অমসুং ম্যাপ",forecast_trends:"নুংশিতগী থাজবা অমসুং প্রবণতা",more_information:"মথংগী ঈশিং",no_recent_chats:"খোঙদা চ্যাট নত্তে",no_saved_locations:"থাদ্রবা মফম নত্তে",nwp_gfs:"NWP / GFS মডেল",rain_forecast:"ইশিং থাজবা",recent_chats:"খোঙদা চ্যাট",report:"রিপোর্ট",search_location:"নগর, গ্রাম নত্ত্রগা মফম শেমজিনবিয়ু...",sector_advisory:"খাতাগী পামজিনবা",sign_in:"সাইন ইন তৌ",smart_early_warnings:"স্মার্ট মাংদা সতর্কতা",smart_notifications:"স্মার্ট নোটিফিকেশন",temperature:"নুংশিত মশাগী চাং",weather_data_appear:"নুংশিতগী ঈশিংসু মফম অসিদা উবা ফংগনি।",weather_insights:"নুংশিতগী মরম শান্নবা",weather_intelligence:"নুংশিতগী মতমগী শিং",weather_trends:"নুংশিতগী প্রবণতা",your_ai_weather_assistant:"নহাক্কী AI নুংশিত সহায়ক",your_location:"নহাক্কী মফম"},
 mr:{about_weathergpt:"WeatherGPT बद्दल",accuracy_performance:"अचूकता आणि कार्यक्षमता",ai_recommendations:"AI शिफारसी",air_quality_uv:"हवेची गुणवत्ता आणि UV",alerts_safety:"इशारे आणि सुरक्षितता",back_to_chat:"चॅटवर परत जा",climate_history:"हवामान आणि इतिहास",detailed_precipitation:"तपशीलवार पाऊस",detecting_location:"स्थान शोधत आहे",environment_map:"पर्यावरण आणि नकाशा",forecast_trends:"अंदाज आणि कल",more_information:"अधिक माहिती",no_recent_chats:"अलीकडील चॅट नाहीत",no_saved_locations:"जतन केलेली ठिकाणे नाहीत",nwp_gfs:"NWP / GFS मॉडेल",rain_forecast:"पावसाचा अंदाज",recent_chats:"अलीकडील चॅट",report:"अहवाल",search_location:"शहर, गाव किंवा परिसर शोधा...",sector_advisory:"क्षेत्रीय सल्ला",sign_in:"साइन इन करा",smart_early_warnings:"स्मार्ट पूर्वसूचना",smart_notifications:"स्मार्ट सूचना",temperature:"तापमान",weather_data_appear:"हवामानाची माहिती येथे दिसेल.",weather_insights:"हवामान माहिती विश्लेषण",weather_intelligence:"हवामान बुद्धिमत्ता",weather_trends:"हवामानातील कल",your_ai_weather_assistant:"तुमचा AI हवामान सहाय्यक",your_location:"तुमचे स्थान"},
 ne:{about_weathergpt:"WeatherGPT बारे",accuracy_performance:"शुद्धता र कार्यसम्पादन",ai_recommendations:"AI सिफारिसहरू",air_quality_uv:"वायु गुणस्तर र UV",alerts_safety:"चेतावनी र सुरक्षा",back_to_chat:"च्याटमा फर्कनुहोस्",climate_history:"जलवायु र इतिहास",detailed_precipitation:"विस्तृत वर्षा",detecting_location:"स्थान पत्ता लगाउँदै",environment_map:"वातावरण र नक्सा",forecast_trends:"पूर्वानुमान र प्रवृत्तिहरू",more_information:"थप जानकारी",no_recent_chats:"हालका च्याट छैनन्",no_saved_locations:"सुरक्षित स्थान छैनन्",nwp_gfs:"NWP / GFS मोडेल",rain_forecast:"वर्षाको पूर्वानुमान",recent_chats:"हालका च्याटहरू",report:"रिपोर्ट",search_location:"शहर, गाउँ वा क्षेत्र खोज्नुहोस्...",sector_advisory:"क्षेत्रीय सल्लाह",sign_in:"साइन इन गर्नुहोस्",smart_early_warnings:"स्मार्ट प्रारम्भिक चेतावनी",smart_notifications:"स्मार्ट सूचनाहरू",temperature:"तापक्रम",weather_data_appear:"मौसमको जानकारी यहाँ देखिनेछ।",weather_insights:"मौसम जानकारी विश्लेषण",weather_intelligence:"मौसम बुद्धिमत्ता",weather_trends:"मौसमका प्रवृत्तिहरू",your_ai_weather_assistant:"तपाईंको AI मौसम सहायक",your_location:"तपाईंको स्थान"},
 or:{about_weathergpt:"WeatherGPT ବିଷୟରେ",accuracy_performance:"ସଠିକତା ଏବଂ କାର୍ଯ୍ୟଦକ୍ଷତା",ai_recommendations:"AI ସୁପାରିଶ",air_quality_uv:"ବାୟୁ ଗୁଣବତ୍ତା ଏବଂ UV",alerts_safety:"ସତର୍କତା ଏବଂ ସୁରକ୍ଷା",back_to_chat:"ଚାଟକୁ ଫେରନ୍ତୁ",climate_history:"ଜଳବାୟୁ ଏବଂ ଇତିହାସ",detailed_precipitation:"ବିସ୍ତୃତ ବର୍ଷା",detecting_location:"ସ୍ଥାନ ଚିହ୍ନଟ ହେଉଛି",environment_map:"ପରିବେଶ ଏବଂ ମାନଚିତ୍ର",forecast_trends:"ପୂର୍ବାନୁମାନ ଏବଂ ପ୍ରବଣତା",more_information:"ଅଧିକ ସୂଚନା",no_recent_chats:"ସମ୍ପ୍ରତି କୌଣସି ଚାଟ୍ ନାହିଁ",no_saved_locations:"ସଂରକ୍ଷିତ ସ୍ଥାନ ନାହିଁ",nwp_gfs:"NWP / GFS ମଡେଲ୍",rain_forecast:"ବର୍ଷା ପୂର୍ବାନୁମାନ",recent_chats:"ସମ୍ପ୍ରତି ଚାଟ୍",report:"ରିପୋର୍ଟ",search_location:"ସହର, ଗାଁ କିମ୍ବା ଅଞ୍ଚଳ ଖୋଜନ୍ତୁ...",sector_advisory:"କ୍ଷେତ୍ର ପରାମର୍ଶ",sign_in:"ସାଇନ୍ ଇନ୍ କରନ୍ତୁ",smart_early_warnings:"ସ୍ମାର୍ଟ ପ୍ରାରମ୍ଭିକ ସତର୍କତା",smart_notifications:"ସ୍ମାର୍ଟ ବିଜ୍ଞପ୍ତି",temperature:"ତାପମାତ୍ରା",weather_data_appear:"ପାଣିପାଗ ସୂଚନା ଏଠାରେ ଦେଖାଯିବ।",weather_insights:"ପାଣିପାଗ ସୂଚନା ବିଶ୍ଳେଷଣ",weather_intelligence:"ପାଣିପାଗ ବୁଦ୍ଧିମତ୍ତା",weather_trends:"ପାଣିପାଗ ପ୍ରବଣତା",your_ai_weather_assistant:"ଆପଣଙ୍କ AI ପାଣିପାଗ ସହାୟକ",your_location:"ଆପଣଙ୍କ ସ୍ଥାନ"},
 pa:{about_weathergpt:"WeatherGPT ਬਾਰੇ",accuracy_performance:"ਸ਼ੁੱਧਤਾ ਅਤੇ ਕਾਰਗੁਜ਼ਾਰੀ",ai_recommendations:"AI ਸਿਫ਼ਾਰਸ਼ਾਂ",air_quality_uv:"ਹਵਾ ਦੀ ਗੁਣਵੱਤਾ ਅਤੇ UV",alerts_safety:"ਚੇਤਾਵਨੀਆਂ ਅਤੇ ਸੁਰੱਖਿਆ",back_to_chat:"ਚੈਟ ਤੇ ਵਾਪਸ ਜਾਓ",climate_history:"ਜਲਵਾਯੂ ਅਤੇ ਇਤਿਹਾਸ",detailed_precipitation:"ਵਿਸਤ੍ਰਿਤ ਮੀਂਹ",detecting_location:"ਟਿਕਾਣਾ ਲੱਭਿਆ ਜਾ ਰਿਹਾ ਹੈ",environment_map:"ਵਾਤਾਵਰਣ ਅਤੇ ਨਕਸ਼ਾ",forecast_trends:"ਪੂਰਵ-ਅਨੁਮਾਨ ਅਤੇ ਰੁਝਾਨ",more_information:"ਹੋਰ ਜਾਣਕਾਰੀ",no_recent_chats:"ਕੋਈ ਹਾਲੀਆ ਚੈਟ ਨਹੀਂ",no_saved_locations:"ਕੋਈ ਸੁਰੱਖਿਅਤ ਟਿਕਾਣਾ ਨਹੀਂ",nwp_gfs:"NWP / GFS ਮਾਡਲ",rain_forecast:"ਮੀਂਹ ਦੀ ਭਵਿੱਖਬਾਣੀ",recent_chats:"ਹਾਲੀਆ ਚੈਟਾਂ",report:"ਰਿਪੋਰਟ",search_location:"ਸ਼ਹਿਰ, ਪਿੰਡ ਜਾਂ ਇਲਾਕਾ ਖੋਜੋ...",sector_advisory:"ਖੇਤਰ ਸਲਾਹ",sign_in:"ਸਾਈਨ ਇਨ ਕਰੋ",smart_early_warnings:"ਸਮਾਰਟ ਸ਼ੁਰੂਆਤੀ ਚੇਤਾਵਨੀਆਂ",smart_notifications:"ਸਮਾਰਟ ਸੂਚਨਾਵਾਂ",temperature:"ਤਾਪਮਾਨ",weather_data_appear:"ਮੌਸਮ ਦੀ ਜਾਣਕਾਰੀ ਇੱਥੇ ਦਿਖਾਈ ਦੇਵੇਗੀ।",weather_insights:"ਮੌਸਮ ਜਾਣਕਾਰੀ ਵਿਸ਼ਲੇਸ਼ਣ",weather_intelligence:"ਮੌਸਮ ਬੁੱਧੀਮਤਾ",weather_trends:"ਮੌਸਮ ਦੇ ਰੁਝਾਨ",your_ai_weather_assistant:"ਤੁਹਾਡਾ AI ਮੌਸਮ ਸਹਾਇਕ",your_location:"ਤੁਹਾਡਾ ਟਿਕਾਣਾ"},
 sa:{about_weathergpt:"WeatherGPT विषये",accuracy_performance:"शुद्धता कार्यक्षमता च",ai_recommendations:"AI अनुशंसाः",air_quality_uv:"वायुगुणवत्ता UV च",alerts_safety:"सूचनाः सुरक्षा च",back_to_chat:"संवादं प्रति प्रत्यागच्छतु",climate_history:"जलवायुः इतिहासश्च",detailed_precipitation:"विस्तृतवृष्टिः",detecting_location:"स्थानं ज्ञायते",environment_map:"पर्यावरणं मानचित्रं च",forecast_trends:"पूर्वानुमानं प्रवृत्तयश्च",more_information:"अधिकं विवरणम्",no_recent_chats:"अद्यतनाः संवादाः न सन्ति",no_saved_locations:"संगृहीतस्थानानि न सन्ति",nwp_gfs:"NWP / GFS प्रतिमानम्",rain_forecast:"वृष्टेः पूर्वानुमानम्",recent_chats:"अद्यतनसंवादाः",report:"प्रतिवेदनम्",search_location:"नगरं ग्रामं वा क्षेत्रं अन्विष्यताम्...",sector_advisory:"क्षेत्रपरामर्शः",sign_in:"प्रविशन्तु",smart_early_warnings:"स्मार्ट पूर्वसूचनाः",smart_notifications:"स्मार्ट सूचनाः",temperature:"तापमानम्",weather_data_appear:"मौसमसम्बद्धा सूचना अत्र दृश्यते।",weather_insights:"मौसमसूचनाविश्लेषणम्",weather_intelligence:"मौसमबुद्धिमत्ता",weather_trends:"मौसमप्रवृत्तयः",your_ai_weather_assistant:"भवतः AI मौसमसहायकः",your_location:"भवतः स्थानम्"},
 sat:{about_weathergpt:"WeatherGPT ᱵᱟᱵᱚᱛ",accuracy_performance:"ᱥᱟᱹᱨᱤ ᱟᱨ ᱠᱟᱹᱢᱤ",ai_recommendations:"AI ᱥᱟᱞᱟᱦ",air_quality_uv:"ᱦᱟᱣᱟ ᱜᱩᱱ ᱟᱨ UV",alerts_safety:"ᱥᱟᱵᱽᱦᱟᱹᱱ ᱟᱨ ᱵᱟᱹᱪᱟᱣ",back_to_chat:"ᱪᱟᱴ ᱨᱮ ᱦᱟᱹᱨᱤ ᱢᱮ",climate_history:"ᱡᱟᱹᱭᱜᱟ ᱟᱨ ᱤᱛᱤᱦᱟᱥ",detailed_precipitation:"ᱯᱷᱟᱨᱟᱹᱜ ᱥᱤᱫᱟᱹ",detecting_location:"ᱡᱟᱭᱜᱟ ᱵᱚᱫᱚᱞ ᱦᱚᱪᱚ",environment_map:"ᱯᱟᱹᱨᱤᱵᱮᱥ ᱟᱨ ᱱᱟᱠᱷᱟ",forecast_trends:"ᱥᱟᱹᱠᱷᱟᱛ ᱟᱨ ᱛᱷᱟᱱ",more_information:"ᱵᱟᱹᱲᱛᱤ ᱵᱟᱵᱚᱛ",no_recent_chats:"ᱡᱟᱹᱞᱤ ᱪᱟᱴ ᱵᱟᱹᱝ",no_saved_locations:"ᱥᱟᱢᱠᱟᱹᱢ ᱡᱟᱭᱜᱟ ᱵᱟᱹᱝ",nwp_gfs:"NWP / GFS ᱢᱚᱰᱮᱞ",rain_forecast:"ᱥᱤᱫᱟᱹ ᱥᱟᱹᱠᱷᱟᱛ",recent_chats:"ᱡᱟᱹᱞᱤ ᱪᱟᱴ",report:"ᱨᱤᱯᱚᱨᱴ",search_location:"ᱥᱚᱦᱚᱨ, ᱜᱟᱶ ᱟᱨ ᱡᱟᱭᱜᱟ ᱞᱮᱠᱟ...",sector_advisory:"ᱥᱮᱠᱴᱚᱨ ᱥᱟᱞᱟᱦ",sign_in:"ᱥᱟᱭᱤᱱ ᱤᱱ",smart_early_warnings:"ᱥᱢᱟᱨᱴ ᱢᱟᱹᱲᱤ ᱥᱟᱵᱽᱦᱟᱹᱱ",smart_notifications:"ᱥᱢᱟᱨᱴ ᱱᱚᱴᱤᱯᱷᱤᱠᱮᱥᱚᱱ",temperature:"ᱦᱟᱹᱲ",weather_data_appear:"ᱦᱟᱣᱟ ᱵᱟᱵᱚᱛ ᱡᱟᱱᱠᱟᱹᱨᱤ ᱱᱚᱰᱮ ᱧᱮᱞᱚᱜᱼᱟ।",weather_insights:"ᱦᱟᱣᱟ ᱡᱟᱱᱠᱟᱹᱨᱤ ᱵᱤᱥᱞᱮᱥᱚᱱ",weather_intelligence:"ᱦᱟᱣᱟ ᱵᱩᱫᱷᱤ",weather_trends:"ᱦᱟᱣᱟ ᱛᱷᱟᱱ",your_ai_weather_assistant:"ᱟᱢᱟᱜ AI ᱦᱟᱣᱟ ᱥᱟᱦᱟᱭᱤᱭᱟ",your_location:"ᱟᱢᱟᱜ ᱡᱟᱭᱜᱟ"},
 sd:{about_weathergpt:"WeatherGPT بابت",accuracy_performance:"درستگي ۽ ڪارڪردگي",ai_recommendations:"AI سفارشون",air_quality_uv:"هوا جو معيار ۽ UV",alerts_safety:"خبرداريون ۽ حفاظت",back_to_chat:"چيٽ ڏانهن واپس وڃو",climate_history:"موسم ۽ تاريخ",detailed_precipitation:"تفصيلي برسات",detecting_location:"جڳهه ڳولي پئي وڃي",environment_map:"ماحول ۽ نقشو",forecast_trends:"اڳڪٿي ۽ رجحان",more_information:"وڌيڪ معلومات",no_recent_chats:"تازيون چيٽون ناهن",no_saved_locations:"محفوظ جڳهيون ناهن",nwp_gfs:"NWP / GFS ماڊل",rain_forecast:"برسات جي اڳڪٿي",recent_chats:"تازيون چيٽون",report:"رپورٽ",search_location:"شهر، ڳوٺ يا علائقو ڳوليو...",sector_advisory:"شعبي جي صلاح",sign_in:"سائن ان ڪريو",smart_early_warnings:"سمارٽ اڳواٽ خبرداريون",smart_notifications:"سمارٽ اطلاع",temperature:"درجو حرارت",weather_data_appear:"موسم جي معلومات هتي ظاهر ٿيندي.",weather_insights:"موسم جي معلومات جو تجزيو",weather_intelligence:"موسمي ذهانت",weather_trends:"موسم جا رجحان",your_ai_weather_assistant:"توهان جو AI موسم مددگار",your_location:"توهان جي جڳهه"},
 ta:{about_weathergpt:"WeatherGPT பற்றி",accuracy_performance:"துல்லியம் மற்றும் செயல்திறன்",ai_recommendations:"AI பரிந்துரைகள்",air_quality_uv:"காற்றின் தரம் மற்றும் UV",alerts_safety:"எச்சரிக்கைகள் மற்றும் பாதுகாப்பு",back_to_chat:"அரட்டைக்குத் திரும்பு",climate_history:"காலநிலை மற்றும் வரலாறு",detailed_precipitation:"விரிவான மழைப்பொழிவு",detecting_location:"இருப்பிடம் கண்டறியப்படுகிறது",environment_map:"சுற்றுச்சூழல் மற்றும் வரைபடம்",forecast_trends:"முன்னறிவிப்பு மற்றும் போக்குகள்",more_information:"மேலும் தகவல்",no_recent_chats:"சமீபத்திய அரட்டைகள் இல்லை",no_saved_locations:"சேமித்த இடங்கள் இல்லை",nwp_gfs:"NWP / GFS மாதிரி",rain_forecast:"மழை முன்னறிவிப்பு",recent_chats:"சமீபத்திய அரட்டைகள்",report:"அறிக்கை",search_location:"நகரம், கிராமம் அல்லது பகுதியைத் தேடுங்கள்...",sector_advisory:"துறை ஆலோசனை",sign_in:"உள்நுழைக",smart_early_warnings:"ஸ்மார்ட் முன் எச்சரிக்கைகள்",smart_notifications:"ஸ்மார்ட் அறிவிப்புகள்",temperature:"வெப்பநிலை",weather_data_appear:"வானிலைத் தகவல் இங்கே தோன்றும்.",weather_insights:"வானிலை தகவல் பகுப்பாய்வு",weather_intelligence:"வானிலை நுண்ணறிவு",weather_trends:"வானிலை போக்குகள்",your_ai_weather_assistant:"உங்கள் AI வானிலை உதவியாளர்",your_location:"உங்கள் இருப்பிடம்"},
 te:{about_weathergpt:"WeatherGPT గురించి",accuracy_performance:"ఖచ్చితత్వం మరియు పనితీరు",ai_recommendations:"AI సిఫార్సులు",air_quality_uv:"గాలి నాణ్యత మరియు UV",alerts_safety:"హెచ్చరికలు మరియు భద్రత",back_to_chat:"చాట్‌కు తిరిగి వెళ్లండి",climate_history:"వాతావరణం మరియు చరిత్ర",detailed_precipitation:"వివరణాత్మక వర్షపాతం",detecting_location:"స్థానాన్ని గుర్తిస్తోంది",environment_map:"పర్యావరణం మరియు మ్యాప్",forecast_trends:"అంచనా మరియు ధోరణులు",more_information:"మరింత సమాచారం",no_recent_chats:"ఇటీవలి చాట్‌లు లేవు",no_saved_locations:"సేవ్ చేసిన ప్రదేశాలు లేవు",nwp_gfs:"NWP / GFS మోడల్",rain_forecast:"వర్ష సూచన",recent_chats:"ఇటీవలి చాట్‌లు",report:"నివేదిక",search_location:"నగరం, గ్రామం లేదా ప్రాంతాన్ని వెతకండి...",sector_advisory:"రంగ సలహా",sign_in:"సైన్ ఇన్ చేయండి",smart_early_warnings:"స్మార్ట్ ముందస్తు హెచ్చరికలు",smart_notifications:"స్మార్ట్ నోటిఫికేషన్లు",temperature:"ఉష్ణోగ్రత",weather_data_appear:"వాతావరణ సమాచారం ఇక్కడ కనిపిస్తుంది.",weather_insights:"వాతావరణ సమాచారం విశ్లేషణ",weather_intelligence:"వాతావరణ మేధస్సు",weather_trends:"వాతావరణ ధోరణులు",your_ai_weather_assistant:"మీ AI వాతావరణ సహాయకుడు",your_location:"మీ స్థానం"},
 ur:{about_weathergpt:"WeatherGPT کے بارے میں",accuracy_performance:"درستگی اور کارکردگی",ai_recommendations:"AI سفارشات",air_quality_uv:"ہوا کا معیار اور UV",alerts_safety:"انتباہات اور حفاظت",back_to_chat:"چیٹ پر واپس جائیں",climate_history:"آب و ہوا اور تاریخ",detailed_precipitation:"تفصیلی بارش",detecting_location:"مقام تلاش کیا جا رہا ہے",environment_map:"ماحول اور نقشہ",forecast_trends:"پیش گوئی اور رجحانات",more_information:"مزید معلومات",no_recent_chats:"حالیہ چیٹس نہیں ہیں",no_saved_locations:"محفوظ مقامات نہیں ہیں",nwp_gfs:"NWP / GFS ماڈل",rain_forecast:"بارش کی پیش گوئی",recent_chats:"حالیہ چیٹس",report:"رپورٹ",search_location:"شہر، گاؤں یا علاقہ تلاش کریں...",sector_advisory:"شعبہ جاتی مشورہ",sign_in:"سائن اِن کریں",smart_early_warnings:"سمارٹ ابتدائی انتباہات",smart_notifications:"سمارٹ اطلاعات",temperature:"درجہ حرارت",weather_data_appear:"موسم کی معلومات یہاں ظاہر ہوں گی۔",weather_insights:"موسمی معلومات کا تجزیہ",weather_intelligence:"موسمی ذہانت",weather_trends:"موسم کے رجحانات",your_ai_weather_assistant:"آپ کا AI موسم معاون",your_location:"آپ کا مقام"}
};
Object.entries(CORE_EXTRA_LANGUAGE_TRANSLATIONS).forEach(([language, translations]) => {
    APP_TRANSLATIONS[language] = { ...APP_TRANSLATIONS[language], ...translations };
});

/* Merge the additional packs without overwriting English/Hindi. */
Object.entries(EXTRA_LANGUAGE_TRANSLATIONS).forEach(([language, translations]) => {
    APP_TRANSLATIONS[language] = {
        ...APP_TRANSLATIONS.en,
        ...(APP_TRANSLATIONS[language] || {}),
        ...translations
    };
});

/*
 * Every advertised language is now registered in APP_TRANSLATIONS.
 * Missing long-form messages are intentionally left to the dynamic
 * localization layer rather than silently replacing them with a fake
 * English translation.
 */
APP_TRANSLATIONS.bn = { ...APP_TRANSLATIONS.bn, your_location: "আপনার অবস্থান" };
APP_TRANSLATIONS.hi = { ...APP_TRANSLATIONS.hi, your_location: "आपका स्थान" };

// The most visible of the "runtime-only" labels below (used on every single
// forecast/chart view) are also hardcoded for Hindi so they render instantly
// and correctly without depending on the dynamic translation endpoint.
Object.assign(APP_TRANSLATIONS.hi, {
    today_label: "आज",
    now_label: "अभी",
    weather: "मौसम",
    date_label: "तारीख़",
    max_temperature: "अधिकतम तापमान",
    min_temperature: "न्यूनतम तापमान",
    precipitation_label: "वर्षा",
    rain_probability_percent: "बारिश की संभावना (%)",
    wind_kmh: "हवा (किमी/घंटा)",
    rainfall_mm: "वर्षा (मिमी)",
    probability_percent: "संभावना (%)",
    average_temperature: "औसत तापमान",
    annual_precipitation: "वार्षिक वर्षा",
    gfs_temperature: "GFS तापमान",
});

// Advisory-module labels (agriculture / aviation / marine / urban / disaster)
// and the compact-alerts panel — these render on nearly every screen, so
// they're hardcoded here rather than depending on a live translation call.
Object.assign(APP_TRANSLATIONS.hi, {
    active_alert: "सक्रिय चेतावनी",
    active_alerts: "सक्रिय चेतावनियाँ",
    advisory_support_only: "केवल सलाहकार सहायता। स्थानीय कृषि मार्गदर्शन से निर्णयों की पुष्टि करें।",
    cloud_cover: "बादल आवरण",
    decision_support_only_aviation: "केवल निर्णय-सहायता। उड़ान संबंधी निर्णयों से पहले आधिकारिक विमानन जानकारी जाँचें।",
    decision_support_only_marine: "केवल निर्णय-सहायता। आधिकारिक समुद्री मार्गदर्शन का पालन करें।",
    field_actions: "फ़ील्ड से जुड़ी कार्रवाइयाँ",
    flood_cyclone_unavailable: "बाढ़ और चक्रवात चेतावनियाँ उपलब्ध नहीं हैं।",
    forecast_rule_risk_estimate: "पूर्वानुमान/नियम - आधारित जोखिम अनुमान",
    generating_advisory: "लाइव मौसम से सलाह तैयार की जा रही है...",
    gusts: "तेज़ झोंके",
    hazard_warning: "खतरे की चेतावनी",
    heavy_rain_next_12h: "अगले 12 घंटों में भारी बारिश",
    highest_priority: "उच्चतम प्राथमिकता",
    humidity_label: "आर्द्रता",
    listen_label: "सुनें",
    live_label: "लाइव",
    marine_risks: "समुद्री जोखिम",
    marine_weather_risk: "समुद्री मौसम का जोखिम",
    max_swell: "अधिकतम महातरंग",
    max_wave: "अधिकतम लहर",
    no_major_priority: "कोई प्रमुख प्राथमिकता नहीं",
    official_imd_signal: "आधिकारिक IMD संकेत",
    official_signal_detected: "आधिकारिक संकेत का पता चला",
    operational_checks: "परिचालन जांच",
    overall_multihazard_risk: "कुल मिलाकर बहु-जोखिम स्तर",
    pressure: "दबाव",
    priority_actions: "प्राथमिकता कार्रवाइयाँ",
    rain_probability: "बारिश की संभावना",
    recommendations: "सिफारिशें",
    recommended_actions: "अनुशंसित कार्रवाइयाँ",
    risk: "जोखिम",
    risk_assessment_combines: "जोखिम आकलन पूर्वानुमान की स्थितियों और आधिकारिक चेतावनी संकेतों को जोड़ता है।",
    smart_city_weather_risk: "स्मार्ट सिटी में मौसम का जोखिम",
    stop_label: "रोकें",
    strong_wind_next_12h: "अगले 12 घंटों में तेज़ हवा",
    swell: "महातरंग",
    thunderstorm_next_12h: "अगले 12 घंटों में आंधी-तूफान",
    top_hazard: "सबसे बड़ा खतरा",
    visibility: "दृश्यता",
    wave_height: "लहर की ऊँचाई",
    wave_period: "लहर की अवधि",
    weather_based_crop_attention: "मौसम-आधारित फसल ध्यान",
    weather_label: "मौसम",
    weather_related_aviation_risk: "मौसम से जुड़ा विमानन जोखिम",
    weather_risks: "मौसम संबंधी जोखिम",
    weather_signals: "मौसम संकेत",
    weather_signals_used: "मौसम के संकेतों का इस्तेमाल किया गया",
    wind_label: "हवा",
    wind_wave: "पवन तरंग",
});

// English source labels used by Chart.js/canvas and other runtime-only UI.
// They are fetched through the same account-free translation endpoint for all
// supported Indian languages.
Object.assign(APP_TRANSLATIONS.en, {
    rain_probability_percent: "Rain probability (%)",
    wind_kmh: "Wind (km/h)",
    rainfall_mm: "Rainfall (mm)",
    probability_percent: "Probability (%)",
    average_temperature: "Average temperature",
    annual_precipitation: "Annual precipitation",
    gfs_temperature: "GFS temperature",
    today_label: "Today",
    now_label: "Now",
    weather: "Weather",
    date_label: "Date",
    max_temperature: "Max Temperature",
    min_temperature: "Min Temperature",
    precipitation_label: "Precipitation",
    no_active_weather_alerts: "No active weather alerts reported.",
    current_location: "Current location",
    selected_location: "Selected location",
    live_weather_data: "Live weather data",
    loading_weather: "Loading weather...",
    weather_information_available: "Weather information available",
    listen_label: "Listen",
    stop_label: "Stop",
    authentication_failed: "Authentication failed",
    sign_in: "Sign In",
    create_account: "Create Account",
    welcome_back: "Welcome back",
    account_created: "Account created",
    logged_in: "Logged in",
    logged_out: "Logged out",
    location_not_found: "Location not found",
    location_not_available: "Location not available",
    search_location: "Search location",
    weather_alert: "Weather Alert",
    clear_sky: "Clear sky",
    mainly_clear: "Mainly clear",
    partly_cloudy: "Partly cloudy",
    overcast: "Overcast",
    foggy: "Foggy",
    light_drizzle: "Light drizzle",
    moderate_drizzle: "Moderate drizzle",
    heavy_drizzle: "Heavy drizzle",
    light_rain: "Light rain",
    moderate_rain: "Moderate rain",
    heavy_rain: "Heavy rain",
    rain_showers: "Rain showers",
    thunderstorm: "Thunderstorm"
});

Object.keys(APP_LANGUAGES).forEach(language => {
    APP_TRANSLATIONS[language] = APP_TRANSLATIONS[language] || {
        ...APP_TRANSLATIONS.en
    };
});


/* =========================================================
   DYNAMIC MULTILINGUAL RUNTIME
   ========================================================= */

const LANGUAGE_PACK_STORAGE_PREFIX = "weatherGPTLanguagePack:";
const DYNAMIC_TEXT_CACHE = Object.create(null);
const LEGACY_TEXT_NODES = new Map();
const DYNAMIC_SKIP_KEYS = new Set([
    "id", "code", "date", "time", "timestamp", "latitude", "longitude",
    "location", "source", "provider", "model", "unit", "units", "icon",
    "level", "severity", "risk_level", "url", "email", "username",
    "_safety_hazard"
]);

function languagePackStorageKey(language) {
    return LANGUAGE_PACK_STORAGE_PREFIX + String(language || "en");
}

function restoreCachedLanguagePack(language) {
    const lang = String(language || "en");
    if (lang === "en") return true;
    try {
        const raw = localStorage.getItem(languagePackStorageKey(lang));
        if (!raw) return false;
        const cached = JSON.parse(raw);
        if (cached && typeof cached === "object" && !Array.isArray(cached)) {
            APP_TRANSLATIONS[lang] = {
                ...APP_TRANSLATIONS.en,
                ...(APP_TRANSLATIONS[lang] || {}),
                ...cached
            };
            return true;
        }
    } catch (error) {
        console.warn("Could not restore language pack:", error);
    }
    return false;
}

async function ensureLanguagePack(language) {
    const lang = String(language || "en");
    if (lang === "en") return APP_TRANSLATIONS.en;

    restoreCachedLanguagePack(lang);
    const existing = APP_TRANSLATIONS[lang] || {};

    // Only fetch keys that are actually rendered by the current HTML. The
    // full English dictionary contains many backend/dynamic keys that do not
    // need a language-pack request on every language switch. All core dashboard
    // labels are bundled locally for the supported languages.
    const renderedKeys = new Set();
    document.querySelectorAll("[data-i18n]").forEach(el => renderedKeys.add(el.getAttribute("data-i18n")));
    document.querySelectorAll("[data-i18n-placeholder]").forEach(el => renderedKeys.add(el.getAttribute("data-i18n-placeholder")));
    document.querySelectorAll("[data-i18n-title]").forEach(el => renderedKeys.add(el.getAttribute("data-i18n-title")));
    document.querySelectorAll("[data-i18n-aria-label]").forEach(el => renderedKeys.add(el.getAttribute("data-i18n-aria-label")));

    const dynamicKeys = [
        "weather_based_crop_attention","temperature","humidity_label","rain_probability","wind_label","weather_risks","recommendations","field_actions","weather_signals_used","advisory_support_only","generating_advisory",
        "smart_city_weather_risk","priority_actions","highest_priority","no_major_priority","weather_related_aviation_risk","weather_label","gusts","visibility","cloud_cover","pressure","thunderstorm_next_12h","heavy_rain_next_12h","strong_wind_next_12h","operational_checks","weather_signals","decision_support_only_aviation",
        "marine_weather_risk","wave_height","wave_period","wind_wave","swell","max_wave","max_swell","marine_risks","decision_support_only_marine","flood_cyclone_unavailable","hazard_warning","recommended_actions","official_signal_detected","forecast_rule_risk_estimate","overall_multihazard_risk","top_hazard","official_imd_signal","risk","risk_assessment_combines",
        "rain_probability_percent","wind_kmh","rainfall_mm","probability_percent","average_temperature","annual_precipitation","gfs_temperature","today_label","now_label","weather","date_label","max_temperature","min_temperature","precipitation_label","no_active_weather_alerts","current_location","selected_location","live_weather_data","loading_weather","weather_information_available","listen_label","stop_label","authentication_failed","sign_in","create_account","welcome_back","account_created","logged_in","logged_out","location_not_found","location_not_available","search_location","weather_alert","clear_sky","mainly_clear","partly_cloudy","overcast","foggy","light_drizzle","moderate_drizzle","heavy_drizzle","light_rain","moderate_rain","heavy_rain","rain_showers","thunderstorm",
        /* ---- Enum / status labels rendered via translateRiskLevel() and AQI/UV helpers ---- */
        "low","moderate","high","very_high","extreme","good","hazardous","unhealthy","unhealthy_sensitive","very_unhealthy","unavailable",
        /* ---- Alert panel & safety guidance ---- */
        "weather_alerts","active_alert","active_alerts","live_label","weather_alerts_off","enable_browser_notifications","weather_signal_unavailable",
        /* ---- AQI / UV descriptive sentences ---- */
        "aqi_data_unavailable","aqi_good","aqi_moderate","aqi_unhealthy_sensitive","aqi_unhealthy","aqi_very_unhealthy","aqi_hazardous",
        "uv_data_unavailable","uv_low","uv_moderate","uv_high","uv_very_high","uv_extreme",
        /* ---- Advisory availability / loading / error messages ---- */
        "agriculture_advisory_unavailable","urban_advisory_unavailable","aviation_advisory_unavailable","marine_advisory_unavailable","disaster_intelligence_unavailable",
        "unable_generate_marine_advisory","unable_generate_urban_advisory","unable_generate_aviation_advisory","unable_load_weather_data","unable_load_weather_intelligence",
        "forecast_unavailable","forecast_24h_unavailable","location_not_available_load_weather","analyzing_marine_conditions","analyzing_aviation_conditions",
        /* ---- Smart alerts / notifications ---- */
        "smart_alerts_enabled","smart_alerts_unavailable","smart_alerts_load_failed","no_active_smart_alerts","high_priority_conditions","alert_assessment_complete",
        "unable_load_smart_alerts","building_unified_early_warnings","enable_alerts","notifications_not_supported","notifications_blocked","notification_permission_denied",
        "notification_status","try_again","background_push_enabled","unable_enable_notifications",
        /* ---- Location detection ---- */
        "gps_location_detected","using_last_known_location","last_known_location","location_unavailable","location_permission_denied","location_request_timed_out","search_location_manually",
        /* ---- Misc labels used directly via t() ---- */
        "crop_label","not_specified","not_evaluated","official_imd_warnings_detected","updated","view_more_alerts","hide_extra_alerts",
        "safety_dos","safety_donts","safety_important","safety_official_info","personal_safety_guidance_for","what_you_should_do","what_you_should_not_do",
        "your_selected_location","follow_official_emergency_instructions","severity_green","severity_yellow","severity_orange","severity_red",
        "calls_label","avg_label","last_label","no_server_route_calls_yet","evaluated_label","accuracy_requires_reference_observations","live_session_uptime","attention_label"
    ];
    dynamicKeys.forEach(key => renderedKeys.add(key));
    const sourceKeys = Object.keys(APP_TRANSLATIONS.en).filter(key => renderedKeys.has(key));
    const missingKeys = sourceKeys.filter(
        key => !existing[key] || existing[key] === APP_TRANSLATIONS.en[key]
    );

    if (!missingKeys.length && Object.keys(existing).length >= sourceKeys.length) {
        return APP_TRANSLATIONS[lang];
    }

    const pack = { ...(APP_TRANSLATIONS[lang] || {}) };
    let allChunksTranslated = true;

    for (let start = 0; start < missingKeys.length; start += 60) {
        const keys = missingKeys.slice(start, start + 60);
        const texts = keys.map(key => APP_TRANSLATIONS.en[key]);

        try {
            const response = await fetch("/api/translate-batch", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ texts, language: lang })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const payload = await response.json();
            const translated = Array.isArray(payload.texts) ? payload.texts : [];

            if (translated.length !== texts.length) {
                throw new Error("Incomplete translation batch");
            }

            keys.forEach((key, index) => {
                const value = String(translated[index] ?? "").trim();
                // Do not silently store an English fallback as the translation.
                if (value && value !== APP_TRANSLATIONS.en[key]) {
                    pack[key] = value;
                }
            });
        } catch (error) {
            allChunksTranslated = false;
            console.warn(`Language pack chunk failed for ${lang}:`, error);
        }
    }

    APP_TRANSLATIONS[lang] = {
        ...APP_TRANSLATIONS.en,
        ...pack
    };

    // Cache only when every requested chunk translated successfully.
    if (allChunksTranslated && missingKeys.every(key =>
        pack[key] && pack[key] !== APP_TRANSLATIONS.en[key]
    )) {
        try {
            localStorage.setItem(
                languagePackStorageKey(lang),
                JSON.stringify(pack)
            );
        } catch (error) {
            console.warn("Could not cache language pack:", error);
        }
    }

    return APP_TRANSLATIONS[lang] || APP_TRANSLATIONS.en;
}

function isLikelyEnglishSource(value) {
    const text = String(value ?? "").trim();
    if (!text || text.length > 1500) return false;
    if (/^https?:\/\//i.test(text)) return false;
    if (/^[\d\s%°+\-./:,()]+$/.test(text)) return false;
    if (text === "WeatherGPT") return false;
    // English UI is overwhelmingly Latin-script. A native-script result is
    // already translated and must never be translated again as English.
    const latin = (text.match(/[A-Za-z]/g) || []).length;
    const native = (text.match(/[\u0980-\u0D7F\u0900-\u097F\u0A00-\u0DFF\u0600-\u06FF\u1C50-\u1C7F]/g) || []).length;
    return latin >= 2 && latin >= native * 2;
}

function shouldTranslateDynamicString(value, sourceLanguage = "en") {
    const text = String(value ?? "").trim();
    if (!text || text.length > 1500) return false;
    if (/^https?:\/\//i.test(text)) return false;
    if (/^[\d\s%°+\-./:,()]+$/.test(text)) return false;
    if (text === "WeatherGPT") return false;
    if (String(sourceLanguage || "en") === "en") return isLikelyEnglishSource(text);
    return /[A-Za-z\u0600-\u097F\u0980-\u0D7F\u0A00-\u0FFF]/.test(text);
}

async function translateDynamicStrings(texts, language, sourceLanguage = "en") {
    const lang = String(language || "en");
    const source = String(sourceLanguage || "en");
    const values = texts.map(x => String(x ?? ""));
    if (lang === source || !values.length) return values;

    const unique = [...new Set(values.filter(v => shouldTranslateDynamicString(v, source)))];
    if (!unique.length) return values;
    const cacheKey = `${source}->${lang}`;
    DYNAMIC_TEXT_CACHE[cacheKey] ||= Object.create(null);

    const missing = unique.filter(text => !DYNAMIC_TEXT_CACHE[cacheKey][text]);
    if (missing.length) {
        try {
            for (let start = 0; start < missing.length; start += 80) {
                const chunk = missing.slice(start, start + 80);
                const response = await fetch("/api/translate-batch", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ texts: chunk, language: lang, source_language: source })
                });
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const payload = await response.json();
                const batch = Array.isArray(payload.texts) && payload.texts.length === chunk.length ? payload.texts : chunk;
                chunk.forEach((text, index) => {
                    const translated = String(batch[index] ?? "").trim();
                    if (translated && translated !== text) DYNAMIC_TEXT_CACHE[cacheKey][text] = translated;
                });
            }
        } catch (error) {
            console.warn("Dynamic translation failed:", error);
        }
    }

    return values.map(text => DYNAMIC_TEXT_CACHE[cacheKey][text] || text);
}

async function localizeObjectDeep(value, language, keyName = "") {
    const lang = String(language || "en");
    if (lang === "en" || value == null) return value;

    // Collect the complete payload first, then translate all human-readable
    // strings in one batch. The old recursive implementation issued one
    // /api/translate-batch request for every individual string in an object,
    // which created dozens of requests for a single advisory.
    const entries = [];
    function collect(node, key = "", path = []) {
        if (typeof node === "string") {
            if (!DYNAMIC_SKIP_KEYS.has(key) && shouldTranslateDynamicString(node, "en")) {
                entries.push({ path, text: node });
            }
            return;
        }
        if (Array.isArray(node)) {
            node.forEach((item, index) => collect(item, key, path.concat(index)));
            return;
        }
        if (node && typeof node === "object") {
            Object.entries(node).forEach(([childKey, child]) => {
                if (!DYNAMIC_SKIP_KEYS.has(childKey)) collect(child, childKey, path.concat(childKey));
            });
        }
    }
    collect(value, keyName, []);
    if (!entries.length) return value;

    const translated = await translateDynamicStrings(entries.map(x => x.text), lang, "en");
    const root = Array.isArray(value) ? [...value] : { ...value };

    function setAtPath(node, path, replacement) {
        if (!path.length) return replacement;
        const [head, ...tail] = path;
        if (Array.isArray(node)) {
            const copy = [...node];
            copy[head] = tail.length ? setAtPath(copy[head], tail, replacement) : replacement;
            return copy;
        }
        const copy = { ...node };
        copy[head] = tail.length ? setAtPath(copy[head], tail, replacement) : replacement;
        return copy;
    }

    let output = root;
    entries.forEach((entry, index) => {
        const value = translated[index];
        if (value && value !== entry.text) output = setAtPath(output, entry.path, value);
    });
    return output;
}

async function translateVisibleTextNodes(language, sourceLanguage = "en") {
    const lang = String(language || "en");
    const source = String(sourceLanguage || "en");
    if (lang === "en" && source === "en") return;

    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const nodes = []; const originals = []; const sources = [];

    while (walker.nextNode()) {
        const node = walker.currentNode;
        const parent = node.parentElement;
        if (!parent) continue;
        if (parent.closest("script,style,textarea,input,select,option,pre,code,canvas,svg,[data-no-auto-translate]")) continue;
        if (parent.closest("[data-i18n], [data-i18n-placeholder], [data-i18n-title], [data-i18n-aria-label]")) continue;
        const text = node.nodeValue?.trim() || "";
        if (!text) continue;
        // For a direct language-to-language switch, use the previous language
        // for native text and English for any English fallback that leaked in.
        const nodeSource = source !== "en" && !isLikelyEnglishSource(text) ? source : "en";
        if (!shouldTranslateDynamicString(text, nodeSource)) continue;
        nodes.push(node); originals.push(text); sources.push(nodeSource);
    }

    if (nodes.length) {
        // Group by source language because the translation API needs both sides.
        const translatedBySource = new Map();
        for (const src of [...new Set(sources)]) {
            const indexes = sources.map((v, i) => v === src ? i : -1).filter(i => i >= 0);
            const vals = indexes.map(i => originals[i]);
            const translated = await translateDynamicStrings(vals, lang, src);
            indexes.forEach((idx, j) => translatedBySource.set(idx, translated[j]));
        }
        nodes.forEach((node, index) => {
            if (!node.parentNode) return;
            const current = node.nodeValue || "";
            const leading = current.match(/^\s*/)?.[0] || "";
            const trailing = current.match(/\s*$/)?.[0] || "";
            node.nodeValue = leading + (translatedBySource.get(index) || originals[index]) + trailing;
        });
    }

    // Translate unmarked attributes too, so title/aria/placeholder strings
    // added by JavaScript do not remain in English.
    const attrNodes = document.querySelectorAll("[title]:not([data-i18n-title]), [aria-label]:not([data-i18n-aria-label]), [placeholder]:not([data-i18n-placeholder])");
    const attrItems = [];
    attrNodes.forEach(el => {
        if (el.matches("input,textarea") && el.disabled) return;
        for (const attr of ["title", "aria-label", "placeholder"]) {
            const value = el.getAttribute(attr);
            if (value && shouldTranslateDynamicString(value, "en")) attrItems.push({el, attr, value});
        }
    });
    if (attrItems.length) {
        const translated = await translateDynamicStrings(attrItems.map(x => x.value), lang, "en");
        attrItems.forEach((item, i) => item.el.setAttribute(item.attr, translated[i] || item.value));
    }
}


/* =========================================================
   TRANSLATION GETTER
   ========================================================= */

function getTranslation(language, key) {

    const selected =
        APP_TRANSLATIONS[language] ||
        APP_TRANSLATIONS.en;

    return (
        selected[key] ||
        APP_TRANSLATIONS.en[key] ||
        key
    );
}


/* =========================================================
   TRANSLATE HTML
   ========================================================= */

function translateApp(language) {

    document
        .querySelectorAll("[data-i18n]")
        .forEach(element => {

            const key =
                element.getAttribute("data-i18n");

            element.textContent =
                getTranslation(language, key);
        });


    document
        .querySelectorAll("[data-i18n-placeholder]")
        .forEach(element => {

            const key =
                element.getAttribute(
                    "data-i18n-placeholder"
                );

            element.placeholder =
                getTranslation(language, key);
        });


    document
        .querySelectorAll("[data-i18n-title]")
        .forEach(element => {

            const key =
                element.getAttribute(
                    "data-i18n-title"
                );

            element.title =
                getTranslation(language, key);
        });


    document
        .querySelectorAll("[data-i18n-aria-label]")
        .forEach(element => {

            const key =
                element.getAttribute(
                    "data-i18n-aria-label"
                );

            element.setAttribute(
                "aria-label",
                getTranslation(language, key)
            );
        });
}


/* =========================================================
   SHORT TRANSLATION FUNCTION
   ========================================================= */

function t(key) {

    const language =
        window.currentLanguage ||
        localStorage.getItem(
            "weatherGPTLanguage"
        ) ||
        "en";

    return getTranslation(
        language,
        key
    );
}


/* =========================================================
   AUTO-TRANSLATE ANY NEWLY ADDED CONTENT
   ---------------------------------------------------------
   Advisory cards, chat replies, alerts and modals are all
   injected into the DOM long after the language was switched.
   Relying on every render function to remember to call
   translateVisibleTextNodes() is fragile -- one missed call
   and English text leaks back into the page. Instead, watch
   the whole document body and re-run the dynamic translator
   (debounced) whenever new text shows up, so the entire app
   stays in the selected language no matter what gets added.
   ========================================================= */

(function setupAutoTranslateObserver() {
    // Intentionally disabled. Dynamic API payloads are localized server-side,
    // static/dynamic labels use t(), and language switching explicitly
    // translates existing visible text. A whole-body MutationObserver causes
    // duplicate translation requests whenever an advisory/card is rendered.
})();