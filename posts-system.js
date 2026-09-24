const SUPABASE_URL = "https://mcgbzfgbaxwmutniorlw.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_5b7pTbiGY2D6vDLRsWgVzA_X926lBeM";

const supabaseScript = document.createElement("script");

supabaseScript.src =
    "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";

supabaseScript.onload = () => {

    window.supabaseClient =
        window.supabase.createClient(
            SUPABASE_URL,
            SUPABASE_KEY
        );

    console.log("WFESC: Supabase connected");

};

document.head.appendChild(supabaseScript);
