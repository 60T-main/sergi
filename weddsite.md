# Weddsite Frontend RSVP Setup

Use this guide in each client frontend project to connect the RSVP form to your shared backend.

## 1) What to configure per client

For every client website, define:

- `API_URL` = your deployed backend endpoint
- `PROJECT_ID` = unique project key for that client (must exist in backend `RSVP_PROJECTS_JSON`)

Example:

```js
const API_URL = "https://your-backend.vercel.app/api/rsvp";
const PROJECT_ID = "nini-nika-2026";
```

---

## 2) Request payload

Send JSON like:

```json
{
  "projectId": "nini-nika-2026",
  "name": "Nino",
  "surname": "Beridze",
  "attendance": "yes",
  "guestCount": 2
}
```

Notes:

- Required fields: `projectId`, `name`, `attendance`
- Optional fields: `surname`, `guestCount`
- `attendance` should be `"yes"` or `"no"`
- `guestCount` should be a non-negative number

---

## 3) Copy-paste submit function (Vanilla JS)

```js
async function submitRsvp(payload) {
  const API_URL = "https://your-backend.vercel.app/api/rsvp";
  const PROJECT_ID = "nini-nika-2026";

  const requestBody = {
    projectId: PROJECT_ID,
    name: payload.name,
    surname: payload.surname || "",
    attendance: payload.attendance, // "yes" or "no"
    guestCount:
      payload.guestCount === undefined || payload.guestCount === null || payload.guestCount === ""
        ? undefined
        : Number(payload.guestCount)
  };

  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody)
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || "RSVP submit failed");
  }

  return result; // { ok: true, emailId: "..." }
}
```

---

## 4) Example form wiring

```js
const form = document.querySelector("#rsvp-form");
const statusEl = document.querySelector("#rsvp-status");

form.addEventListener("submit", async function (e) {
  e.preventDefault();

  const name = document.querySelector("#name").value.trim();
  const surname = document.querySelector("#surname").value.trim();
  const attendance = document.querySelector("input[name='attendance']:checked")?.value;
  const guestCount = document.querySelector("#guestCount").value;

  try {
    statusEl.textContent = "იგზავნება... / Sending...";

    await submitRsvp({
      name,
      surname,
      attendance,
      guestCount
    });

    statusEl.textContent = "მადლობა! თქვენი პასუხი მიღებულია. / Thank you! RSVP received.";
    form.reset();
  } catch (err) {
    statusEl.textContent = "დაფიქსირდა შეცდომა. გთხოვთ სცადოთ თავიდან. / Something went wrong. Please try again.";
    console.error(err);
  }
});
```

---

## 5) Per-client checklist

Before launching each new frontend:

1. Add a new `projectId` entry to backend `RSVP_PROJECTS_JSON` with that client's destination email.
2. Use that exact `PROJECT_ID` in the frontend code.
3. Test one RSVP submission.
4. Confirm email was received by the client.
5. Note: backend currently allows max 2 submissions per IP per `projectId` before returning 429.

---

## 6) Backend env vars reference

Set these on Vercel (Production, and Preview if needed):

- `RESEND_API_KEY`
- `FROM_EMAIL` (example: `RSVP <rsvp@yourdomain.com>`)
- `RSVP_PROJECTS_JSON` (project map JSON)
