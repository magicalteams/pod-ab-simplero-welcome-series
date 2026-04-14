Task One:
Current Manual Task Overview

This is a recurring monthly task to manually sync new Simplero contacts into Anne's Character Substack. Since Simplero and Substack don't integrate automatically, this needs to be done by hand each month to ensure no one falls through the cracks after completing Anne's welcome series.

What Anne Said

"Would be good if you can check Simplero once a month and manually add whoever is new who has completed the welcome series."

Steps (Monthly)

Log into Simplero — Go to Anne's account and filter contacts who have completed the welcome/nurture series.
Check the date of the last import — Only pull contacts who finished the series since the last time this was done (check task notes or a shared tracker for the last run date).
Export new completers — Pull the email list of anyone newly finished with the series.
Import into Substack (Character) — Add them as free subscribers to Anne's Substack account.
Log the date — Update the task or a shared doc with today's date so next month's run has a clean cutoff.

Context

Anne's audience enters her email ecosystem through Simplero, where they receive a welcome/nurture series tied to her former Career Studio brand and her current offerings.
After completing the series, the intended next step is for them to receive Anne's ongoing Character content via Substack — but this handoff doesn't happen automatically.
Anne's Substack subscriber growth is a strategic priority; every qualified contact who completes the nurture series is a warm lead who should be receiving her content.
This task supports the broader goal of building Anne's Character audience and eventually converting free subscribers to paid.

Frequency

Monthly — Run at the start of each month (or on a consistent date). Log the run date each time.


Task Two:
This task was captured from this conversation with Anne:

@Arbesa Gashi I-D has it so that a substack subscribe pop up appears on their website. Is this something I can have on my simplero website? https://i-d.co/ @Cara Katz fyi
i-d.coi-DA global platform for emerging talent, i-D celebrates fashion, culture, individuality and youth.https://i-d.co/4 repliesCara Katz  [10:38 AM]
Hi @Anne I'll have a member of our tech squad review this for you to see what it would take to set up.
Cara Katz  [11:36 PM]
We can take this for you. Do you also want us to mimic the design or would you like to share a different design vision, @Anne?
Anne  [10:23 AM]
@Cara Katz It looks like they just pulled this in from Substack, it doesn’t look specifically designed. I would be fine for it to be the same - Character logo, description pulled in dynamically from the Substack description, sign up bar, t&cs. To me it’s the same as the imbed at the bottom of my homepage, just in a pop up.

OVERVIEW
Build a Substack email capture popup on Anne's Simplero site to drive Substack signups from site visitors. Budget: 2 hours (approved by Alex).

---

ACCESS NEEDED
Before starting, get the following. Reach out to Arbesa if you need help with LastPass.

- Simplero admin access (site settings > custom header/footer scripts). Credentials are in LastPass. Arbesa can help you get added to the LP folder.

---

SPECS
- Substack URL: https://annebenven.substack.com
- Branding reference: https://canva.link/z8f0s0hm640y909
- Copy/design: Match the i-d.co style as reference. Note: this appears to be a Substack embed, not a custom build. If you do need to build it, mimic the text and look of Substack's registration page.
- Trigger: On page load, after a short delay
- Re-show after dismissal: 14 days
- Pages: All pages site-wide

---

STEPS
1. Get Simplero access via LastPass (coordinate with Arbesa if needed).
2. Confirm whether this needs to be a custom build or if embedding Substack's native widget is sufficient.
3. Match colors and fonts to Anne's branding (see Canva link above).
4. Implement popup via Simplero's custom header/footer script settings.
5. Set trigger: on page load with short delay; suppress for 14 days after dismissal; show on all pages.
6. Test before marking done.
7. Drop an ETA in this task as soon as you have one.

---

Adam's Feedback:

Substack provides an embeddable subscribe form. We can use either their iframe embed or we can hit their subscribe endpoint directly with a simple HTML form (email input + hidden publication field).

We can wrap it in a custom popup, like a small snippet of HTML/CSS/JS that shows a modal overlay on page load or after a delay/scroll trigger, like i-d.co does. No third-party tool like OptinMonster would be needed.

We would just inject it via Simplero's custom script area. Simplero lets you add custom code in the site header/footer scripts section. You paste the self-contained snippet there. No Simplero "popup feature" needed at all since we'd be bypassing it entirely with our own code.

The i-d.co popup is just a styled modal div with a Substack subscribe form inside, triggered by JS on page load with a cookie/localStorage check so it doesn't re-show to people who've already dismissed or subscribed.

This is probably 1-2 hours of work. I'd build the popup snippet, style it to match Anne's site branding, add dismiss logic with localStorage, test it on Simplero, and hand it off.

To do the work, I'd need:

Anne's Substack publication URL
Access to Simplero's admin, specifically the site settings where you can add custom header/footer scripts. Either login credentials or they add me as a user
Branding/styling preferences or at minimum the site URL so I can match colors, fonts, etc.
Any specific copy they want (headline, subtext, button label) or I can just match the i-d.co style as a reference
Trigger behavior preference (when should the popup appear)?
On page load (after a short delay)?
On scroll (e.g. 50% down the page)?
On exit intent?
How long before showing it again after someone dismisses it?
Which pages?
All pages site-wide
Only specific ones (e.g. blog posts only, homepage only)?

Items 1 and 2 are blockers. The rest I could move forward with sensible defaults and adjust later.

Cara's response:

Please make sure @adam has LP access to Anne's accounts.

We're approved by Alex for you to spend two hours on this this week.
Anne's Substack publication URL: https://annebenven.substack.com
Access to Simplero's admin, specifically the site settings where you can add custom header/footer scripts. Either login credentials or they add me as a user - You can get these from LastPass. @arbesagashi can help you with getting added to the LP folder.
Branding/styling preferences or at minimum the site URL so I can match colors, fonts, etc. https://canva.link/z8f0s0hm640y909
Any specific copy they want (headline, subtext, button label) or I can just match the i-d.co style as a reference - This is why I attached the thread but this doesn't look like something they actually built. It looks like a Substack embed. If you did have to actually build it you'd just be mimicking the text and look of Substacks registration page.
Trigger behavior preference (when should the popup appear)? - On page load (after a short delay)
How long before showing it again after someone dismisses it? 14 days
Which pages? - All pages site-wide