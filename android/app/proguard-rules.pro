# FlixOn — Regras ProGuard
# Mantém as classes essenciais para que o minify não quebre o app.

# Mantém o Capacitor (ponte WebView)
-keep class com.getcapacitor.** { *; }
-keep class com.getcapacitor.android.** { *; }
-keep class * implements com.getcapacitor.Plugin { *; }

# Mantém o pacote do app
-keep class com.flixon.app.** { *; }

# Mantém anotações usadas pelo Android/WebView
-keepattributes *Annotation*
-keepattributes JavascriptInterface
-keepattributes Signature
-keepattributes EnclosingMethod

# Mantém classes chamadas via reflexão (WebView JS interfaces)
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Supabase / okhttp (rede) — evita remoção de modelos usados por reflexão
-dontwarn okhttp3.**
-dontwarn okio.**
-keep class okhttp3.** { *; }
