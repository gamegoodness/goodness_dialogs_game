/**
 * scenarios.js — THE CONTENT (source of truth).
 *
 * This is a faithful port of the SCENARIOS array from the original
 * goodness_episode1_v3.html prototype. All scenario text, choices, outcomes,
 * scores (`s`) and virtues (`virt`) are preserved EXACTLY as written.
 * The only changes vs. the raw prototype are cosmetic Unicode repairs
 * (mojibake `â` → em dash `—`, corrupted emoji bytes → proper emoji).
 *
 * ── How to add a new episode ────────────────────────────────────────────────
 * Each episode is one array of "moments". Copy this file to
 * episode2.js, edit the moments, and register it in src/data/episodes.js.
 * The shape of a moment:
 *
 *   {
 *     id, title, tag, tc (theme colour), bg (css gradient),
 *     sit  : opening narration,
 *     am   : angel mood key (see ANGEL_FACES),
 *     al   : angel line,
 *     ambig: boolean, ambigNote?: string,
 *     A / B: first-level choices, each with:
 *        text, L2: { sit, am, al, A2:{...}, B2:{...} }
 *        where A2/B2 = { text, s (score delta), oc: outcome card }
 *        oc = { icon (emoji), title, col, bg, txt, virt }
 *     reflect: the kid-facing reflection question
 *   }
 */

export const ANGEL_FACES = {
  happy: '😊', worried: '😟', sad: '😢', hopeful: '🤗', proud: '🥹',
  nervous: '😬', watchful: '👀', curious: '🤔', gentle: '🕊️',
  waiting: '⏳', neutral: '😌',
};

export const EPISODE_1 = [
  {
    id: 1, title: 'The lunchbox', tag: 'Kindness & Sharing', tc: '#1D9E75',
    bg: 'linear-gradient(135deg,#1D9E75,#0F6E56)',
    image: 'bg-scenario-1.png',
    sit: "Milo is eating lunch in the school canteen. A classmate, Priya, quietly opens her bag and looks down — there's nothing inside. She says nothing and stares at the table.",
    am: 'worried', al: 'I wonder what Milo will notice...', ambig: false,
    A: {
      text: 'Quietly offer half your sandwich to Priya',
      L2: {
        sit: "Priya looks surprised. \"Thank you... but I don't want to take your food.\" She shakes her head shyly.",
        am: 'hopeful', al: 'What Milo says next matters...',
        A2: {
          text: "\"It's okay — I have enough. Please take it.\"", s: 2,
          oc: { icon: '🤝', title: 'A friendship begins', col: '#1D9E75', bg: '#E1F5EE', txt: 'Priya lights up. You eat together the rest of the week. One small act of kindness created something lasting.', virt: 'Kindness' },
        },
        B2: {
          text: 'Put it back, feeling awkward', s: 0,
          oc: { icon: '🫤', title: 'A moment hesitated', col: '#5F5E5A', bg: '#F1EFE8', txt: 'Priya stays quiet for the rest of lunch. Noticing the hesitation is already a step forward.', virt: 'Reflection' },
        },
      },
    },
    B: {
      text: 'Look away and keep eating',
      L2: {
        sit: "Your friend beside you whispers: \"Did you notice Priya has nothing to eat today?\"",
        am: 'waiting', al: "There's still a chance here...",
        A2: {
          text: 'Quietly go and tell a teacher', s: 1,
          oc: { icon: '🙋', title: 'Helping from the side', col: '#1D9E75', bg: '#E1F5EE', txt: "A teacher brings Priya a snack. You didn't help directly, but you made sure she wasn't forgotten. Kindness has many shapes.", virt: 'Helpfulness' },
        },
        B2: {
          text: "Say \"That's not really my problem.\"", s: -1,
          oc: { icon: '😞', title: 'Priya goes hungry', col: '#993C1D', bg: '#FAECE7', txt: 'Priya sits in silence all afternoon. Every child deserves to be noticed.', virt: 'Reflection on Selfishness' },
        },
      },
    },
    reflect: 'Has something like this ever happened to you — when you noticed someone needed help? What did you do?',
  },
  {
    id: 2, title: 'The broken vase', tag: 'Honesty & Courage', tc: '#185FA5',
    bg: 'linear-gradient(135deg,#378ADD,#185FA5)',
    image: 'bg-scenario-2.png',
    sit: 'Milo is playing inside when — crack — a vase falls from a shelf and shatters. It was an accident. Mum comes in and looks at the pieces on the floor.',
    am: 'nervous', al: 'The truth, or a story?', ambig: false,
    A: {
      text: "Tell the truth: \"Mum, I knocked it over. It was an accident.\"",
      L2: {
        sit: "Mum's face falls. \"That was Grandma's vase,\" she says quietly.",
        am: 'hopeful', al: 'Honesty takes courage. Keep going...',
        A2: {
          text: "\"I'm really sorry. I should have been more careful.\"", s: 2,
          oc: { icon: '🤗', title: 'Trust holds', col: '#185FA5', bg: '#E6F1FB', txt: 'Mum pulls you into a hug. "Thank you for telling me the truth. That matters more than the vase."', virt: 'Honesty' },
        },
        B2: {
          text: "\"It was an accident — why are you upset?\"", s: 0,
          oc: { icon: '😐', title: 'Honest but defensive', col: '#5F5E5A', bg: '#F1EFE8', txt: 'Mum goes quiet. Being honest includes hearing how others feel too.', virt: 'Reflection' },
        },
      },
    },
    B: {
      text: 'Stay quiet — or quietly blame the cat',
      L2: {
        sit: 'Dad comes in. Seeing the pieces, he scolds the cat. The cat looks confused. You know the truth.',
        am: 'sad', al: "The cat can't speak for itself...",
        A2: {
          text: 'Take a breath and tell Dad the truth now', s: 1,
          oc: { icon: '🐱', title: 'Late honesty still counts', col: '#185FA5', bg: '#E6F1FB', txt: '"Actually — it was me." It\'s harder to say the second time. But the cat comes back inside.', virt: 'Courage' },
        },
        B2: {
          text: 'Stay quiet. Maybe nobody will find out.', s: -2,
          oc: { icon: '😔', title: 'The weight of a small lie', col: '#993C1D', bg: '#FAECE7', txt: "The cat is locked outside. You go to bed with a knot in your stomach. The lie didn't disappear — it moved inside you.", virt: 'Reflection on Dishonesty' },
        },
      },
    },
    reflect: 'Have you ever had to tell someone something hard to say? What helped you be honest — or what made it difficult?',
  },
  {
    id: 3, title: 'The torn friendship', tag: 'Forgiveness', tc: '#D4537E',
    bg: 'linear-gradient(135deg,#D4537E,#993556)',
    image: 'bg-scenario-3.png',
    sit: "Milo's best friend Jai said something really unkind in front of the whole class yesterday. It hurt. Today Jai comes up quietly and says: \"I'm really sorry. I didn't mean it.\"",
    am: 'gentle', al: 'Forgiveness is one of the hardest things...', ambig: false,
    A: {
      text: "\"Okay. I forgive you.\" — even though it still stings",
      L2: {
        sit: 'Jai looks relieved. But later, Jai says something thoughtless about another classmate.',
        am: 'curious', al: "Forgiveness doesn't mean pretending everything is perfect...",
        A2: {
          text: "Gently tell Jai: \"That kind of thing is what hurt me too.\"", s: 2,
          oc: { icon: '💛', title: 'Forgiveness with honesty', col: '#D4537E', bg: '#FBEAF0', txt: 'Jai nods. "You\'re right. I\'ll try to be more careful." Real forgiveness includes honesty — not just letting things go.', virt: 'Forgiveness' },
        },
        B2: {
          text: 'Stay quiet — you already forgave once today', s: 1,
          oc: { icon: '🕊️', title: 'A quiet forgiveness', col: '#D4537E', bg: '#FBEAF0', txt: 'You let it go. The friendship mends slowly. Sometimes the most generous thing is not to count every mistake.', virt: 'Forgiveness' },
        },
      },
    },
    B: {
      text: "\"I'm not ready to forgive you yet.\"",
      L2: {
        sit: 'Jai nods and walks away. At lunch, you sit apart. Jai keeps looking over.',
        am: 'gentle', al: "Not forgiving yet isn't wrong. But notice what it costs...",
        A2: {
          text: 'Wave Jai over to sit with you', s: 1,
          oc: { icon: '🚪', title: 'A small door opens', col: '#D4537E', bg: '#FBEAF0', txt: "Jai sits down. You don't talk about yesterday. But something loosens. Forgiveness doesn't always come with words first.", virt: 'Forgiveness' },
        },
        B2: {
          text: 'Look away', s: 0,
          oc: { icon: '🫤', title: 'Still apart', col: '#5F5E5A', bg: '#F1EFE8', txt: "You each eat alone. You needed space — that's real. Forgiveness is something we choose at our own pace.", virt: 'Reflection' },
        },
      },
    },
    reflect: 'Is there a difference between forgiving someone and trusting them again? What do you think forgiveness really means?',
  },
  {
    id: 4, title: 'The test', tag: 'Honesty vs Loyalty', tc: '#BA7517',
    bg: 'linear-gradient(135deg,#EF9F27,#BA7517)',
    image: 'bg-scenario-4.png',
    sit: "During a maths test, Milo notices best friend Sam is copying from a hidden sheet. Sam catches Milo's eye and mouths: \"Please don't say anything.\" The teacher hasn't noticed.",
    am: 'watchful', al: "This one doesn't have an easy answer...", ambig: true,
    ambigNote: 'Both choices here have real costs. There is no perfect answer — think carefully.',
    A: {
      text: 'Stay quiet and protect Sam',
      L2: {
        sit: 'The test ends. Sam passes. Later Sam whispers: "Thank you. My parents would have been furious." But you feel uneasy.',
        am: 'curious', al: 'Loyalty is real. So is the unease...',
        A2: {
          text: "Tell Sam honestly: \"I covered for you this time, but I won't again.\"", s: 1,
          oc: { icon: '🤝', title: 'Loyalty with a limit', col: '#BA7517', bg: '#FAEEDA', txt: 'Sam goes quiet, then nods. You protected your friend — but you also told the truth about your limit. That took courage too.', virt: 'Loyalty & Honesty' },
        },
        B2: {
          text: 'Say nothing more. Let it pass.', s: 0,
          oc: { icon: '🤐', title: 'The silence stays', col: '#5F5E5A', bg: '#F1EFE8', txt: "Sam is grateful. But the unease doesn't fully go away. Sometimes being loyal costs something quiet inside us.", virt: 'Reflection' },
        },
      },
    },
    B: {
      text: 'Quietly tell the teacher after the test',
      L2: {
        sit: 'Sam is asked to retake the test alone. At break, Sam finds you. "That was you, wasn\'t it."',
        am: 'sad', al: 'Honesty has a cost too...',
        A2: {
          text: "\"Yes. I thought it was the right thing. I'm sorry it hurt you.\"", s: 2,
          oc: { icon: '💙', title: 'Honest and accountable', col: '#BA7517', bg: '#FAEEDA', txt: 'Sam doesn\'t speak to you for two days. But by Thursday they come back. "I was angry. But you were trying to do the right thing." Hard honesty, carried with care, can survive.', virt: 'Honesty' },
        },
        B2: {
          text: 'Deny it was you', s: -2,
          oc: { icon: '😔', title: 'A lie on top of honesty', col: '#993C1D', bg: '#FAECE7', txt: "Sam doesn't believe you. You did the honest thing then flinched from it. Two wrongs in one story.", virt: 'Reflection on Dishonesty' },
        },
      },
    },
    reflect: 'When two good values — like loyalty and honesty — pull in different directions, how do you decide which one to follow?',
  },
  {
    id: 5, title: 'The team project', tag: 'Respect & Collaboration', tc: '#534AB7',
    bg: 'linear-gradient(135deg,#7F77DD,#534AB7)',
    image: 'bg-scenario-5.png',
    sit: 'Milo and Sam are building a class project together. Sam keeps doing things differently from the plan. Milo is getting frustrated — this isn\'t how they agreed.',
    am: 'watchful', al: 'Two minds can build something better — or clash.', ambig: false,
    A: {
      text: 'Pause and ask Sam to explain their idea first',
      L2: {
        sit: 'Sam explains. The idea is actually creative — but Milo still prefers the original plan.',
        am: 'curious', al: 'What if both ideas have something worth keeping?',
        A2: {
          text: 'Suggest combining the best of both ideas', s: 2,
          oc: { icon: '🤝', title: 'Better together', col: '#534AB7', bg: '#EEEDFE', txt: 'The project turns out better than either plan alone. The teacher notices the collaboration. Sam is glowing.', virt: 'Respect' },
        },
        B2: {
          text: 'Politely insist on the original plan', s: 0,
          oc: { icon: '😐', title: "Milo's way", col: '#5F5E5A', bg: '#F1EFE8', txt: 'The project is fine. Sam finishes quietly. Milo wonders later if something better was possible.', virt: 'Reflection' },
        },
      },
    },
    B: {
      text: "Say: \"You're doing it wrong. Let me just do it.\"",
      L2: {
        sit: 'Sam puts down the pencil and goes quiet. The teacher comes over and asks what happened.',
        am: 'sad', al: "Sam's contribution matters too...",
        A2: {
          text: 'Apologise and ask Sam to help again', s: 1,
          oc: { icon: '💜', title: 'A real apology', col: '#534AB7', bg: '#EEEDFE', txt: '"I\'m sorry Sam. Can we try together?" Sam hesitates, then picks up the pencil. The Good Angel exhales.', virt: 'Respect' },
        },
        B2: {
          text: 'Do the whole project alone', s: -1,
          oc: { icon: '😞', title: 'Done, but not together', col: '#993C1D', bg: '#FAECE7', txt: "The project is finished. Sam doesn't look up. Milo did the work but lost something harder to replace.", virt: 'Reflection on Disrespect' },
        },
      },
    },
    reflect: 'Have you ever worked with someone who did things differently? What helped — or what made it harder?',
  },
  {
    id: 6, title: 'The hard game', tag: 'Perseverance & Attitude', tc: '#0F6E56',
    bg: 'linear-gradient(135deg,#1D9E75,#0F6E56)',
    image: 'bg-scenario-6.png',
    sit: 'Milo is playing a board game with others and keeps losing — three times now. One player laughs each time. The frustration is building and Milo wants to quit.',
    am: 'gentle', al: 'How we lose matters as much as how we win...', ambig: false,
    A: {
      text: 'Take a deep breath and keep playing',
      L2: {
        sit: 'Milo loses again. The same player laughs again.',
        am: 'proud', al: 'What Milo does now is the real win...',
        A2: {
          text: 'Say "Good game" — and mean it as much as possible', s: 2,
          oc: { icon: '🏆', title: 'The real win', col: '#0F6E56', bg: '#E1F5EE', txt: 'The room goes quiet. Even the laughing player stops. Perseverance has a quiet kind of power.', virt: 'Perseverance' },
        },
        B2: {
          text: 'Step away for a moment to breathe', s: 1,
          oc: { icon: '🌿', title: 'Knowing your limits', col: '#0F6E56', bg: '#E1F5EE', txt: 'Taking space when things feel too big is wise, not weak. Sometimes the brave thing is to pause.', virt: 'Self-awareness' },
        },
      },
    },
    B: {
      text: 'Push the game pieces away in frustration',
      L2: {
        sit: 'The pieces scatter. Everyone looks at Milo. There\'s an awkward silence.',
        am: 'gentle', al: 'These feelings are real. What now?',
        A2: {
          text: 'Take a breath, say sorry, and help collect the pieces', s: 1,
          oc: { icon: '💪', title: 'Owning it', col: '#0F6E56', bg: '#E1F5EE', txt: '"Sorry. I got frustrated." The others relax. Catching yourself after a hard moment shows real strength.', virt: 'Good Attitude' },
        },
        B2: {
          text: 'Storm out of the room', s: -1,
          oc: { icon: '😞', title: 'Anger in charge', col: '#993C1D', bg: '#FAECE7', txt: 'Milo sits alone, still upset. Anger can close doors we didn\'t mean to close.', virt: 'Reflection on Giving Up' },
        },
      },
    },
    reflect: 'Think of a time you felt really frustrated. What helped you calm down?',
  },
];
