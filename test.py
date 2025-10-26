import streamlit as st
import os
import requests
from dotenv import load_dotenv

# --- LOAD ENVIRONMENT VARIABLES ---
load_dotenv()
api_key_1 = os.getenv("API_KEY_1")
api_key_2 = os.getenv("API_KEY_2")
dr_morgan_id = os.getenv("DR_MORGAN_ID")
john_ruetten_id = os.getenv("JOHN_RUETTEN_ID")
steve_hooks_id = os.getenv("STEVE_HOOKS_ID")
nels_rasmussen_id = os.getenv("NELS_RASMUSSEN_ID")

# --- PAGE TITLE ---
st.title("Forensic Case Chat")

# --- CHARACTER SELECTION ---
character_names = {
    "Dr. Morgan (Forensic Pathologist)": dr_morgan_id,
    "John Ruetten (Husband)": john_ruetten_id,
    "Steve Hooks (Detective Partner)": steve_hooks_id,
    "Nels Rasmussen (Father)": nels_rasmussen_id
}

# Character selector
selected_character = st.selectbox(
    "Choose who you'd like to talk to:",
    list(character_names.keys())
)

# --- SESSION STATE SETUP ---
if "chats" not in st.session_state:
    # Dictionary mapping each character to their own message history + session ID
    st.session_state.chats = {
        name: {"messages": [], "session_id": ""} for name in character_names
    }

if "input_text" not in st.session_state:
    st.session_state.input_text = ""

# --- FUNCTION TO SEND MESSAGE ---
def send_message():
    user_input = st.session_state.input_text
    if not user_input:
        return

    chat_data = st.session_state.chats[selected_character]
    character_id = character_names[selected_character]

    # Determine API key based on character
    if selected_character.startswith(("Steve", "John", "Dr.")):
        api_key = api_key_1
    else:
        api_key = api_key_2  # For Nels Rasmussen

    # Add user message
    chat_data["messages"].append({"sender": "user", "message": user_input})

    payload = {
        "sessionId": chat_data["session_id"],
        "characterId": character_id,
        "message": user_input
    }
    headers = {
        "Content-Type": "application/json",
        "x-api-key": api_key
    }

    try:
        response = requests.post("https://neocortex.link/api/v2/chat", json=payload, headers=headers)
        response.raise_for_status()
        data = response.json()

        # Update session ID
        chat_data["session_id"] = data.get("sessionId", "")

        # Append bot reply
        bot_reply = data.get("response", "Sorry, I didn’t get that.")
        chat_data["messages"].append({"sender": "bot", "message": bot_reply})
    except requests.exceptions.RequestException as e:
        chat_data["messages"].append({"sender": "bot", "message": f"Error: {e}"})

    # Clear input box
    st.session_state.input_text = ""

# --- DISPLAY CHAT HISTORY FOR SELECTED CHARACTER ---
st.markdown(f"### Chat with {selected_character.split('(')[0].strip()}")

chat_data = st.session_state.chats[selected_character]
for msg in chat_data["messages"]:
    if msg["sender"] == "user":
        st.markdown(f"**You:** {msg['message']}")
    else:
        st.markdown(f"**{selected_character.split('(')[0].strip()}:** {msg['message']}")

# --- INPUT BOX ---
st.text_input(
    "Type your message here...",
    key="input_text",
    on_change=send_message
)