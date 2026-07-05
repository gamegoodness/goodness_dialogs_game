/**
 * scenarios.js - THE CONTENT (source of truth).
 *
 * A faithful port of the SCENARIOS array from the original prototype. All
 * scenario text, choices, outcomes, scores (`s`) and virtues (`virt`) are
 * preserved. Two content-level additions were made for the dialog/visual-novel
 * presentation:
 *   - `char`: who this moment is mainly about (key into CHARACTER_NAMES).
 *   - `img` on a story beat / outcome card: the illustration (path under
 *     /assets/images) that steps onto the stage from that beat onward. Once a
 *     beat sets an `img`, it stays on stage until a later beat changes it, so
 *     only beats that CHANGE the picture need an `img`.
 *   - All em dashes / en dashes in player-facing text were removed and rewritten
 *     with plain punctuation.
 *
 * ── How to add a new episode ────────────────────────────────────────────────
 * Each episode is one array of "moments". Copy this file, edit the moments, and
 * register it in src/data/episodes.js. The shape of a moment:
 *
 *   {
 *     id, title, tag, tc (theme colour), bg (css gradient), image, char,
 *     sit  : one-line scene summary (used when the player skips the story),
 *     intro: the STORY, an array of dialog beats played one at a time:
 *              { who: null, text }        -> narrator (scene explanation)
 *              { who: 'priya', text }     -> that character speaks (focus mode:
 *                                            background blurs + darkens, their
 *                                            portrait takes the stage)
 *            The player taps OK to move from beat to beat, like a
 *            dialog/visual-novel game. Choices appear after the last beat.
 *     am   : angel mood key (see ANGEL_FACES),
 *     al   : angel line,
 *     ambig: boolean, ambigNote?: string,
 *     A / B: first-level choices, each with:
 *        text, L2: { sit, story (dialog beats, same shape as intro), am, al,
 *                    A2:{...}, B2:{...} }
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

/** Display names for the speech-bubble nameplate, keyed by beat `who`. */
export const CHARACTER_NAMES = {
  milo: 'Milo', priya: 'Priya', jai: 'Jai', sam: 'Sam',
  mum: 'Mum', dad: 'Dad', teacher: 'Teacher',
};

export const EPISODE_1 = [
  {
    id: 1, title: 'The lunchbox', tag: 'Kindness & Sharing', tc: '#1D9E75',
    bg: 'linear-gradient(135deg,#1D9E75,#0F6E56)',
    image: 'backgrounds/1.png', char: 'priya',
    sit: "Milo is eating lunch in the school canteen. A classmate, Priya, quietly opens her bag and looks down. There is nothing inside. She says nothing and stares at the table.",
    intro: [
      { who: null, text: 'Lunchtime at school. The canteen is loud and full of chatter. Milo sits down and unpacks his lunch.', img: '1/milo_unpacks_lunch.png' },
      { who: 'milo', text: 'Cheese and tomato sandwiches. My favourite!', img: '1/happy_about_sandwich.png' },
      { who: null, text: 'Across the table, his classmate Priya quietly opens her bag and looks inside. There is nothing there.', img: '1/priya_looking_at_desk_no_lunch.png' },
      { who: 'priya', text: 'Oh no... I must have forgotten my lunch at home today.' },
      { who: null, text: 'She says it almost in a whisper. Then she goes quiet and stares at the table.' },
    ],
    am: 'worried', al: 'I wonder what Milo will notice...', ambig: false,
    A: {
      text: 'Quietly offer half your sandwich to Priya',
      L2: {
        sit: "Priya looks surprised. \"Thank you... but I don't want to take your food.\" She shakes her head shyly.",
        story: [
          { who: null, text: 'Milo slides half of his sandwich across the table to Priya. She looks up, surprised.', img: '1/milo_offers_sandwich.png' },
          { who: 'priya', text: "Thank you... but I don't want to take your food." },
          { who: null, text: 'She shakes her head shyly and looks down again.' },
        ],
        am: 'hopeful', al: 'What Milo says next matters...',
        A2: {
          text: "\"It's okay, I have enough. Please take it.\"", s: 2,
          oc: { icon: '🤝', title: 'A friendship begins', col: '#1D9E75', bg: '#E1F5EE', txt: 'Priya lights up. You eat together the rest of the week. One small act of kindness created something lasting.', virt: 'Kindness', img: '1/milo_ooffers_food_and_priya_and_milo_eats.png' },
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
        story: [
          { who: null, text: 'Milo looks away and keeps eating. A moment later, his friend Jai leans closer and whispers.' },
          { who: 'jai', text: 'Psst, Milo. Did you notice Priya has nothing to eat today?', img: '1/jai_whispers_priya_no_lunch.png' },
        ],
        am: 'waiting', al: "There's still a chance here...",
        A2: {
          text: 'Quietly go and tell a teacher', s: 1,
          oc: { icon: '🙋', title: 'Helping from the side', col: '#1D9E75', bg: '#E1F5EE', txt: "A teacher brings Priya a snack. You didn't help directly, but you made sure she wasn't forgotten. Kindness has many shapes.", virt: 'Helpfulness', img: '1/jai_and_milo_tell_teacher.png' },
        },
        B2: {
          text: "Say \"That's not really my problem.\"", s: -1,
          oc: { icon: '😞', title: 'Priya goes hungry', col: '#993C1D', bg: '#FAECE7', txt: 'Priya sits in silence all afternoon. Every child deserves to be noticed.', virt: 'Reflection on Selfishness', img: '1/who_cares_priya_no_lunch.png' },
        },
      },
    },
    reflect: 'Has something like this ever happened to you, when you noticed someone needed help? What did you do?',
  },
  {
    id: 2, title: 'The broken vase', tag: 'Honesty & Courage', tc: '#185FA5',
    bg: 'linear-gradient(135deg,#378ADD,#185FA5)',
    image: 'backgrounds/2.png', char: 'milo',
    sit: 'Milo is playing inside when, crack, a vase falls from a shelf and shatters. It was an accident. Mum comes in and looks at the pieces on the floor.',
    intro: [
      { who: null, text: "After school, Milo is playing with a ball inside the house. The shelf with Grandma's vase is very close.", img: '2/milo_playing_home.png' },
      { who: 'milo', text: "One more catch! I've almost got this trick...", img: '2/milo_playing_ball.png' },
      { who: null, text: 'Crack. The ball clips the shelf, and the vase falls and shatters across the floor. It was an accident.', img: '2/cat_and_milo_both_scared.png' },
      { who: 'mum', text: 'Milo? What was that sound?' },
      { who: null, text: 'Mum walks in and looks at the broken pieces on the floor. Then she looks at Milo.', img: '2/mom_looking_sad.png' },
    ],
    am: 'nervous', al: 'The truth, or a story?', ambig: false,
    A: {
      text: "Tell the truth: \"Mum, I knocked it over. It was an accident.\"",
      L2: {
        sit: "Mum's face falls. \"That was Grandma's vase,\" she says quietly.",
        story: [
          { who: 'milo', text: 'Mum, I knocked it over. It was an accident.', img: '2/i_did_it_mom.png' },
          { who: 'mum', text: "That was Grandma's vase...", img: '2/mom_looking_sad.png' },
          { who: null, text: "Mum's face falls. She says it very quietly, and the room feels still." },
        ],
        am: 'hopeful', al: 'Honesty takes courage. Keep going...',
        A2: {
          text: "\"I'm really sorry. I should have been more careful.\"", s: 2,
          oc: { icon: '🤗', title: 'Trust holds', col: '#185FA5', bg: '#E6F1FB', txt: 'Mum pulls you into a hug. "Thank you for telling me the truth. That matters more than the vase."', virt: 'Honesty', img: '2/mom_hug_milo.png' },
        },
        B2: {
          text: "\"It was an accident, why are you upset?\"", s: 0,
          oc: { icon: '😐', title: 'Honest but defensive', col: '#5F5E5A', bg: '#F1EFE8', txt: 'Mum goes quiet. Being honest includes hearing how others feel too.', virt: 'Reflection', img: '2/what_the_big_deal_mom.png' },
        },
      },
    },
    B: {
      text: 'Stay quiet, or quietly blame the cat',
      L2: {
        sit: 'Dad comes in. Seeing the pieces, he scolds the cat. The cat looks confused. You know the truth.',
        story: [
          { who: null, text: 'Milo stays quiet and steps back from the pieces. Dad walks in and sees the mess.', img: '2/dad_asking_from_milo_whos_wrong.png' },
          { who: 'dad', text: 'Whiskers! Was this you? Bad cat! Outside you go.', img: '2/blaming_to_the_cat.png' },
          { who: null, text: 'The cat looks confused as it is carried to the door. Milo knows the truth.', img: '2/milo_stay_quiet_cat_outdoor.png' },
        ],
        am: 'sad', al: "The cat can't speak for itself...",
        A2: {
          text: 'Take a breath and tell Dad the truth now', s: 1,
          oc: { icon: '🐱', title: 'Late honesty still counts', col: '#185FA5', bg: '#E6F1FB', txt: '"Actually, it was me." It\'s harder to say the second time. But the cat comes back inside.', virt: 'Courage', img: '2/dad_asking_from_milo_whos_wrong.png' },
        },
        B2: {
          text: 'Stay quiet. Maybe nobody will find out.', s: -2,
          oc: { icon: '😔', title: 'The weight of a small lie', col: '#993C1D', bg: '#FAECE7', txt: "The cat is locked outside. You go to bed with a knot in your stomach. The lie didn't disappear. It moved inside you.", virt: 'Reflection on Dishonesty', img: '2/putting_the_cat_outside.png' },
        },
      },
    },
    reflect: 'Have you ever had to tell someone something hard to say? What helped you be honest, or what made it difficult?',
  },
  {
    id: 3, title: 'The torn friendship', tag: 'Forgiveness', tc: '#D4537E',
    bg: 'linear-gradient(135deg,#D4537E,#993556)',
    image: 'backgrounds/3.png', char: 'jai',
    sit: "Milo's best friend Jai said something really unkind in front of the whole class yesterday. It hurt. Today Jai comes up quietly and says: \"I'm really sorry. I didn't mean it.\"",
    intro: [
      { who: null, text: "Yesterday, Milo's best friend Jai said something really unkind in front of the whole class. It hurt." },
      { who: null, text: 'Today at school, Jai walks up quietly, looking at the floor.', img: '3/jai_apologize_milo.png' },
      { who: 'jai', text: "Hey, Milo... I'm really sorry about yesterday. I didn't mean it." },
      { who: null, text: 'Jai stands there, waiting nervously for an answer.' },
    ],
    am: 'gentle', al: 'Forgiveness is one of the hardest things...', ambig: false,
    A: {
      text: "\"Okay. I forgive you.\" Even though it still stings",
      L2: {
        sit: 'Jai looks relieved. But later, Jai says something thoughtless about another classmate.',
        story: [
          { who: 'milo', text: 'Okay. I forgive you.', img: '3/okay_i_forgive_jai.png' },
          { who: null, text: 'Jai looks relieved and smiles. But later that day, you hear Jai talking about another classmate.' },
          { who: 'jai', text: "Did you see Dev's drawing? It looks like a baby drew it!", img: '3/joking_about_classmate_art.png' },
          { who: null, text: 'That was thoughtless too.' },
        ],
        am: 'curious', al: "Forgiveness doesn't mean pretending everything is perfect...",
        A2: {
          text: "Gently tell Jai: \"That kind of thing is what hurt me too.\"", s: 2,
          oc: { icon: '💛', title: 'Forgiveness with honesty', col: '#D4537E', bg: '#FBEAF0', txt: 'Jai nods. "You\'re right. I\'ll try to be more careful." Real forgiveness includes honesty, not just letting things go.', virt: 'Forgiveness' },
        },
        B2: {
          text: 'Stay quiet, you already forgave once today', s: 1,
          oc: { icon: '🕊️', title: 'A quiet forgiveness', col: '#D4537E', bg: '#FBEAF0', txt: 'You let it go. The friendship mends slowly. Sometimes the most generous thing is not to count every mistake.', virt: 'Forgiveness' },
        },
      },
    },
    B: {
      text: "\"I'm not ready to forgive you yet.\"",
      L2: {
        sit: 'Jai nods and walks away. At lunch, you sit apart. Jai keeps looking over.',
        story: [
          { who: 'milo', text: "I'm not ready to forgive you yet.", img: '3/im_not_ready_to_forgive.png' },
          { who: null, text: 'Jai nods slowly and walks away.', img: '3/jai_sadly_walking_away.png' },
          { who: null, text: 'At lunch, you sit apart. Jai keeps looking over at you.', img: '3/look_back_stay_quiet_angry.png' },
        ],
        am: 'gentle', al: "Not forgiving yet isn't wrong. But notice what it costs...",
        A2: {
          text: 'Wave Jai over to sit with you', s: 1,
          oc: { icon: '🚪', title: 'A small door opens', col: '#D4537E', bg: '#FBEAF0', txt: "Jai sits down. You don't talk about yesterday. But something loosens. Forgiveness doesn't always come with words first.", virt: 'Forgiveness', img: '3/invite_to_sit_at_lunch.png' },
        },
        B2: {
          text: 'Look away', s: 0,
          oc: { icon: '🫤', title: 'Still apart', col: '#5F5E5A', bg: '#F1EFE8', txt: "You each eat alone. You needed space, that's real. Forgiveness is something we choose at our own pace.", virt: 'Reflection', img: '3/look_back_stay_quiet_angry.png' },
        },
      },
    },
    reflect: 'Is there a difference between forgiving someone and trusting them again? What do you think forgiveness really means?',
  },
  {
    id: 4, title: 'The test', tag: 'Honesty vs Loyalty', tc: '#BA7517',
    bg: 'linear-gradient(135deg,#EF9F27,#BA7517)',
    image: 'backgrounds/4.png', char: 'sam',
    sit: "During a maths test, Milo notices best friend Sam is copying from a hidden sheet. Sam catches Milo's eye and mouths: \"Please don't say anything.\" The teacher hasn't noticed.",
    intro: [
      { who: null, text: 'Maths test. The classroom is silent except for the scratching of pencils.' },
      { who: null, text: 'Milo looks up for a moment, and notices something. Sam is copying answers from a hidden sheet.', img: '4/sam_copying.png' },
      { who: 'sam', text: "Please... don't say anything.", img: '4/please_dont_say_anyone.png' },
      { who: null, text: "Sam mouths the words silently. The teacher hasn't noticed a thing." },
    ],
    am: 'watchful', al: "This one doesn't have an easy answer...", ambig: true,
    ambigNote: 'Both choices here have real costs. There is no perfect answer. Think carefully.',
    A: {
      text: 'Stay quiet and protect Sam',
      L2: {
        sit: 'The test ends. Sam passes. Later Sam whispers: "Thank you. My parents would have been furious." But you feel uneasy.',
        story: [
          { who: null, text: 'Milo says nothing. The test ends, and Sam passes. Later, Sam finds Milo in the corridor.' },
          { who: 'sam', text: 'Thank you for not telling. My parents would have been furious.' },
          { who: null, text: 'But something feels uneasy inside.' },
        ],
        am: 'curious', al: 'Loyalty is real. So is the unease...',
        A2: {
          text: "Tell Sam honestly: \"I covered for you this time, but I won't again.\"", s: 1,
          oc: { icon: '🤝', title: 'Loyalty with a limit', col: '#BA7517', bg: '#FAEEDA', txt: 'Sam goes quiet, then nods. You protected your friend, but you also told the truth about your limit. That took courage too.', virt: 'Loyalty & Honesty' },
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
        story: [
          { who: null, text: 'After the test, Milo quietly tells the teacher. Sam is asked to retake the test alone.', img: '4/milo_tells_teacher_sam_copied.png' },
          { who: 'sam', text: "That was you, wasn't it." },
          { who: null, text: "Sam's voice is quiet, but hurt." },
        ],
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
    reflect: 'When two good values, like loyalty and honesty, pull in different directions, how do you decide which one to follow?',
  },
  {
    id: 5, title: 'The team project', tag: 'Respect & Collaboration', tc: '#534AB7',
    bg: 'linear-gradient(135deg,#7F77DD,#534AB7)',
    image: 'backgrounds/5.png', char: 'sam',
    sit: 'Milo and Sam are building a class project together. Sam keeps doing things differently from the plan. Milo is getting frustrated. This is not how they agreed.',
    intro: [
      { who: null, text: 'Art class. Milo and Sam are building their class project together, just like they planned.', img: '5/sam_and_milo_working_together.png' },
      { who: 'sam', text: 'Wait, I have a better idea! What if we do this part differently?', img: '5/sam_explaining_idea.png' },
      { who: null, text: 'Sam keeps changing things from the plan. Milo feels the frustration building.' },
      { who: 'milo', text: 'This is not what we agreed on...', img: '5/milo_sad_project.png' },
    ],
    am: 'watchful', al: 'Two minds can build something better, or clash.', ambig: false,
    A: {
      text: 'Pause and ask Sam to explain their idea first',
      L2: {
        sit: 'Sam explains. The idea is actually creative, but Milo still prefers the original plan.',
        story: [
          { who: null, text: 'Milo takes a breath and asks Sam to explain the idea first.', img: '5/sam_explaining_idea.png' },
          { who: 'sam', text: 'Look, if we glue this side first, the tower stands twice as strong!' },
          { who: null, text: 'The idea is actually creative. But Milo still prefers the original plan.' },
        ],
        am: 'curious', al: 'What if both ideas have something worth keeping?',
        A2: {
          text: 'Suggest combining the best of both ideas', s: 2,
          oc: { icon: '🤝', title: 'Better together', col: '#534AB7', bg: '#EEEDFE', txt: 'The project turns out better than either plan alone. The teacher notices the collaboration. Sam is glowing.', virt: 'Respect', img: '5/showing_a_creating_project_to_the_class_sam_and_milo.png' },
        },
        B2: {
          text: 'Politely insist on the original plan', s: 0,
          oc: { icon: '😐', title: "Milo's way", col: '#5F5E5A', bg: '#F1EFE8', txt: 'The project is fine. Sam finishes quietly. Milo wonders later if something better was possible.', virt: 'Reflection', img: '5/milo_does_project_alone.png' },
        },
      },
    },
    B: {
      text: "Say: \"You're doing it wrong. Let me just do it.\"",
      L2: {
        sit: 'Sam puts down the pencil and goes quiet. The teacher comes over and asks what happened.',
        story: [
          { who: 'milo', text: "You're doing it wrong. Let me just do it.", img: '5/milo_say_stay_back_to_sam.png' },
          { who: null, text: 'Sam puts down the pencil and goes very quiet.', img: '5/milo_sad_project.png' },
          { who: 'teacher', text: 'Is everything alright over here?', img: '5/teacher_comes_and_ask_is_everything_okey.png' },
          { who: null, text: 'The teacher looks at them both, waiting.' },
        ],
        am: 'sad', al: "Sam's contribution matters too...",
        A2: {
          text: 'Apologise and ask Sam to help again', s: 1,
          oc: { icon: '💜', title: 'A real apology', col: '#534AB7', bg: '#EEEDFE', txt: '"I\'m sorry Sam. Can we try together?" Sam hesitates, then picks up the pencil. The Good Angel exhales.', virt: 'Respect', img: '5/asks_sam_to_help_again.png' },
        },
        B2: {
          text: 'Do the whole project alone', s: -1,
          oc: { icon: '😞', title: 'Done, but not together', col: '#993C1D', bg: '#FAECE7', txt: "The project is finished. Sam doesn't look up. Milo did the work but lost something harder to replace.", virt: 'Reflection on Disrespect', img: '5/milo_does_project_alone.png' },
        },
      },
    },
    reflect: 'Have you ever worked with someone who did things differently? What helped, or what made it harder?',
  },
  {
    id: 6, title: 'The hard game', tag: 'Perseverance & Attitude', tc: '#0F6E56',
    bg: 'linear-gradient(135deg,#1D9E75,#0F6E56)',
    image: 'backgrounds/6.png', char: 'milo',
    sit: 'Milo is playing a board game with others and keeps losing, three times now. One player laughs each time. The frustration is building and Milo wants to quit.',
    intro: [
      { who: null, text: 'Game night. Milo is playing a board game with friends, and he has lost three times in a row.' },
      { who: null, text: 'One player laughs loudly every time Milo loses.' },
      { who: 'milo', text: "I keep losing... I don't want to play anymore.", img: '6/milo_looks_sad.png' },
      { who: null, text: 'The frustration is building. Milo wants to quit.' },
    ],
    am: 'gentle', al: 'How we lose matters as much as how we win...', ambig: false,
    A: {
      text: 'Take a deep breath and keep playing',
      L2: {
        sit: 'Milo loses again. The same player laughs again.',
        story: [
          { who: null, text: 'Milo takes a deep breath and plays another round. He loses again.' },
          { who: null, text: 'And the same player laughs. Again.' },
        ],
        am: 'proud', al: 'What Milo does now is the real win...',
        A2: {
          text: 'Say "Good game" and mean it as much as possible', s: 2,
          oc: { icon: '🏆', title: 'The real win', col: '#0F6E56', bg: '#E1F5EE', txt: 'The room goes quiet. Even the laughing player stops. Perseverance has a quiet kind of power.', virt: 'Perseverance', img: '6/milo_looks_calm.png' },
        },
        B2: {
          text: 'Step away for a moment to breathe', s: 1,
          oc: { icon: '🌿', title: 'Knowing your limits', col: '#0F6E56', bg: '#E1F5EE', txt: 'Taking space when things feel too big is wise, not weak. Sometimes the brave thing is to pause.', virt: 'Self-awareness', img: '6/milo_looks_calm.png' },
        },
      },
    },
    B: {
      text: 'Push the game pieces away in frustration',
      L2: {
        sit: 'The pieces scatter. Everyone looks at Milo. There is an awkward silence.',
        story: [
          { who: null, text: 'Milo shoves the board. The pieces scatter across the table.', img: '6/angry_milo.png' },
          { who: null, text: 'Everyone goes quiet and looks at Milo. The silence feels heavy.' },
        ],
        am: 'gentle', al: 'These feelings are real. What now?',
        A2: {
          text: 'Take a breath, say sorry, and help collect the pieces', s: 1,
          oc: { icon: '💪', title: 'Owning it', col: '#0F6E56', bg: '#E1F5EE', txt: '"Sorry. I got frustrated." The others relax. Catching yourself after a hard moment shows real strength.', virt: 'Good Attitude', img: '6/milo_collecting_pieces.png' },
        },
        B2: {
          text: 'Storm out of the room', s: -1,
          oc: { icon: '😞', title: 'Anger in charge', col: '#993C1D', bg: '#FAECE7', txt: 'Milo sits alone, still upset. Anger can close doors we did not mean to close.', virt: 'Reflection on Giving Up', img: '6/angrily_going_out_the_room.png' },
        },
      },
    },
    reflect: 'Think of a time you felt really frustrated. What helped you calm down?',
  },
];
