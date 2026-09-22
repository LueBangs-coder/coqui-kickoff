/** Beginner language for a Puerto Rican family and a week of football practice. */
export type Phrase = {
  id: string;
  spanish: string;
  english: string;
  /** Spanish syllables. Capitals mark word stress; this is not an IPA transcription. */
  pronunciation: string;
  note?: string;
  context: string;
  acceptableAnswers?: string[];
};

export type Lesson = {
  id: number;
  title: string;
  subtitle: string;
  goal: string;
  phrases: Phrase[];
};

export const LESSONS: Lesson[] = [
  {
    id: 1,
    title: 'Hola, rookie',
    subtitle: 'A little Spanish goes a long way.',
    goal: 'Greet someone, introduce yourself, and ask them to slow down.',
    phrases: [
      { id: 'hola', spanish: '¡Hola!', english: 'Hello!', pronunciation: '¡HO-la!', context: 'Say hi when you join the huddle.', note: 'The h is silent. Keep each Spanish vowel clear and short.' },
      { id: 'me-llamo', spanish: 'Me llamo…', english: 'My name is…', pronunciation: 'me LLA-mo…', context: 'Add your name after this phrase.', note: 'This is a sentence starter. In Puerto Rico, ll usually has a y-like sound.', acceptableAnswers: ['Me llamo', 'Mi nombre es'] },
      { id: 'como-estas', spanish: '¿Cómo estás?', english: 'How are you?', pronunciation: '¿CÓ-mo es-TÁS?', context: 'Check in with a friend or family member.' },
      { id: 'estoy-bien', spanish: 'Estoy bien.', english: 'I’m well.', pronunciation: 'es-TOY BIEN.', context: 'Answer when someone asks how you are.', acceptableAnswers: ['Estoy bien', 'Bien'] },
      { id: 'gracias', spanish: 'Gracias.', english: 'Thank you.', pronunciation: 'GRA-cias.', context: 'Thank someone for helping you.', note: 'In Puerto Rican Spanish, the c in gracias sounds like s.' },
      { id: 'mas-despacio', spanish: 'Más despacio, por favor.', english: 'More slowly, please.', pronunciation: 'MÁS des-PA-cio, por fa-VOR.', context: 'Use this whenever you need a slower replay.', note: 'Asking for help is part of learning.' },
    ],
  },
  {
    id: 2,
    title: 'Game time',
    subtitle: 'Find your voice in the huddle.',
    goal: 'Invite someone to play and encourage your team.',
    phrases: [
      { id: 'jugamos', spanish: '¿Jugamos?', english: 'Shall we play?', pronunciation: '¿ju-GA-mos?', context: 'Invite a friend to start a game.' },
      { id: 'estoy-listo', spanish: 'Estoy listo.', english: 'I’m ready.', pronunciation: 'es-TOY LIS-to.', context: 'Let your teammate know you are ready.', note: 'A boy can say listo; a girl can say lista. Both are accepted in practice.', acceptableAnswers: ['Estoy listo', 'Estoy lista'] },
      { id: 'tu-turno', spanish: 'Es tu turno.', english: 'It’s your turn.', pronunciation: 'es tu TUR-no.', context: 'Pass the controller or take turns in a drill.' },
      { id: 'pasame-balon', spanish: 'Pásame el balón.', english: 'Pass me the ball.', pronunciation: 'PÁ-sa-me el ba-LÓN.', context: 'Ask for a pass when you are open.', note: 'Balón fits a football here. Pelota is another common word for ball.', acceptableAnswers: ['Pásame el balón', 'Pásame la pelota'] },
      { id: 'vamos-equipo', spanish: '¡Vamos, equipo!', english: 'Let’s go, team!', pronunciation: '¡VA-mos, e-QUI-po!', context: 'Cheer for your team before the next play.' },
      { id: 'buen-trabajo', spanish: '¡Buen trabajo!', english: 'Good job!', pronunciation: '¡BUEN tra-BA-jo!', context: 'Celebrate a teammate’s effort.', acceptableAnswers: ['Buen trabajo', 'Bien hecho'] },
    ],
  },
  {
    id: 3,
    title: 'My people',
    subtitle: 'La familia. The original home team.',
    goal: 'Introduce family members and talk about Puerto Rican identity.',
    phrases: [
      { id: 'mi-familia', spanish: 'Esta es mi familia.', english: 'This is my family.', pronunciation: 'ES-ta es mi fa-MI-lia.', context: 'Introduce the people in a family photo.' },
      { id: 'mi-hermano', spanish: 'Él es mi hermano.', english: 'He is my brother.', pronunciation: 'ÉL es mi her-MA-no.', context: 'Introduce a brother in a pretend conversation.', note: 'Él means he. The h in hermano is silent.' },
      { id: 'mi-hermana', spanish: 'Ella es mi hermana.', english: 'She is my sister.', pronunciation: 'E-lla es mi her-MA-na.', context: 'Introduce a sister in a pretend conversation.' },
      { id: 'de-puerto-rico', spanish: 'Mi abuelo es de Puerto Rico.', english: 'My grandfather is from Puerto Rico.', pronunciation: 'mi a-BUE-lo es de PUER-to RI-co.', context: 'Practice a sample sentence about family roots.', note: 'Abuelo means grandfather; abuela means grandmother. Change the sentence to fit your own family.' },
      { id: 'como-te-llamas', spanish: '¿Cómo te llamas?', english: 'What’s your name?', pronunciation: '¿CÓ-mo te LLA-mas?', context: 'Meet someone new at the park.' },
      { id: 'soy-boricua', spanish: 'Soy boricua.', english: 'I’m Puerto Rican.', pronunciation: 'SOY bo-RI-cua.', context: 'Share your Puerto Rican identity.', note: 'Boricua is a Puerto Rican identity word. It works for any gender.', acceptableAnswers: ['Soy boricua', 'Soy puertorriqueño', 'Soy puertorriqueña'] },
    ],
  },
  {
    id: 4,
    title: 'Food break',
    subtitle: 'Recharge, Puerto Rico style.',
    goal: 'Ask for food and water, and recognize everyday Puerto Rican words.',
    phrases: [
      { id: 'tengo-hambre', spanish: 'Tengo hambre.', english: 'I’m hungry.', pronunciation: 'TEN-go HAM-bre.', context: 'Tell your family you are ready for a snack.', note: 'Spanish uses tener here: literally, I have hunger. The h is silent.' },
      { id: 'quiero-agua', spanish: 'Quiero agua, por favor.', english: 'I want water, please.', pronunciation: 'QUIE-ro A-gua, por fa-VOR.', context: 'Ask for water after practice.' },
      { id: 'habichuelas', spanish: 'Me gustan las habichuelas.', english: 'I like beans.', pronunciation: 'me GUS-tan las ha-bi-CHUE-las.', context: 'Talk about a familiar part of a Puerto Rican meal.', note: 'Habichuelas is a common Puerto Rican word for beans. You may hear frijoles in other places.', acceptableAnswers: ['Me gustan las habichuelas', 'Me gustan los frijoles'] },
      { id: 'una-china', spanish: 'Quiero una china.', english: 'I want an orange.', pronunciation: 'QUIE-ro U-na CHI-na.', context: 'Ask for the fruit at snack time.', note: 'In Puerto Rico, a china can mean an orange. Naranja is widely understood across Spanish-speaking regions.', acceptableAnswers: ['Quiero una china', 'Quiero una naranja'] },
      { id: 'esta-rico', spanish: 'Está rico.', english: 'It’s delicious.', pronunciation: 'es-TÁ RI-co.', context: 'Tell the cook you like the food.', note: 'Use rico for a masculine food word and rica for a feminine one.', acceptableAnswers: ['Está rico', 'Está rica', 'Está delicioso', 'Está deliciosa'] },
      { id: 'quieres-compartir', spanish: '¿Quieres compartir?', english: 'Would you like to share?', pronunciation: '¿QUIE-res com-par-TIR?', context: 'Invite someone to share a snack.', acceptableAnswers: ['Quieres compartir', 'Te gustaría compartir'] },
    ],
  },
  {
    id: 5,
    title: 'Around town',
    subtitle: 'Find the field. Explore the island.',
    goal: 'Ask where something is and follow simple directions.',
    phrases: [
      { id: 'donde-parque', spanish: '¿Dónde está el parque?', english: 'Where is the park?', pronunciation: '¿DÓN-de es-TÁ el PAR-que?', context: 'Ask how to find a place to play.' },
      { id: 'sigue-derecho', spanish: 'Sigue derecho.', english: 'Go straight.', pronunciation: 'SI-gue de-RE-cho.', context: 'Give a friend a simple direction.', note: 'Derecho means straight here; a la derecha means to the right.', acceptableAnswers: ['Sigue derecho', 'Sigue recto', 'Ve derecho', 'Ve recto'] },
      { id: 'dobla-derecha', spanish: 'Dobla a la derecha.', english: 'Turn right.', pronunciation: 'DO-bla a la de-RE-cha.', context: 'Direct someone toward the field.', acceptableAnswers: ['Dobla a la derecha', 'Gira a la derecha'] },
      { id: 'dobla-izquierda', spanish: 'Dobla a la izquierda.', english: 'Turn left.', pronunciation: 'DO-bla a la iz-QUIER-da.', context: 'Practice the other direction.', acceptableAnswers: ['Dobla a la izquierda', 'Gira a la izquierda'] },
      { id: 'parada-guaguas', spanish: '¿Dónde está la parada de guaguas?', english: 'Where is the bus stop?', pronunciation: '¿DÓN-de es-TÁ la pa-RA-da de GUA-guas?', context: 'Ask for the bus stop in Puerto Rico.', note: 'Guagua commonly means bus in Puerto Rico. It can also refer to other larger vehicles, depending on context.', acceptableAnswers: ['Dónde está la parada de guaguas', 'Dónde está la parada de autobús', 'Dónde está la parada del autobús', 'Dónde está la parada de autobuses'] },
      { id: 'estamos-cerca', spanish: 'Estamos cerca.', english: 'We’re nearby.', pronunciation: 'es-TA-mos CER-ca.', context: 'Let a friend know you are almost there.' },
    ],
  },
  {
    id: 6,
    title: 'Make a play',
    subtitle: 'Listen. Move. Make it happen.',
    goal: 'Understand short commands and encourage another try.',
    phrases: [
      { id: 'corre-adelante', spanish: 'Corre hacia adelante.', english: 'Run forward.', pronunciation: 'CO-rre HA-cia a-de-LAN-te.', context: 'Call out a running direction.', note: 'The h in hacia is silent. With practice, the rr in corre is a rolled sound.', acceptableAnswers: ['Corre hacia adelante', 'Corre adelante'] },
      { id: 'mira-izquierda', spanish: 'Mira a tu izquierda.', english: 'Look to your left.', pronunciation: 'MI-ra a tu iz-QUIER-da.', context: 'Help a teammate spot an opening.', acceptableAnswers: ['Mira a tu izquierda', 'Mira hacia tu izquierda', 'Mira a la izquierda'] },
      { id: 'lanza-balon', spanish: 'Lanza el balón.', english: 'Throw the ball.', pronunciation: 'LAN-za el ba-LÓN.', context: 'Give the quarterback a quick instruction.', note: 'In Puerto Rican Spanish, z sounds like s.', acceptableAnswers: ['Lanza el balón', 'Lanza la pelota', 'Tira el balón', 'Tira la pelota'] },
      { id: 'atrapa-balon', spanish: 'Atrapa el balón.', english: 'Catch the ball.', pronunciation: 'a-TRA-pa el ba-LÓN.', context: 'Call to the receiver.', acceptableAnswers: ['Atrapa el balón', 'Atrapa la pelota', 'Coge el balón', 'Coge la pelota'] },
      { id: 'una-vez-mas', spanish: 'Una vez más.', english: 'One more time.', pronunciation: 'U-na VEZ MÁS.', context: 'Ask for another practice rep.' },
      { id: 'podemos-hacerlo', spanish: 'Podemos hacerlo.', english: 'We can do it.', pronunciation: 'po-DE-mos ha-CER-lo.', context: 'Encourage your whole team.' },
    ],
  },
  {
    id: 7,
    title: 'Game day',
    subtitle: 'Your Spanish. Your team. Let’s go.',
    goal: 'Talk about the game and bring the week’s language together.',
    phrases: [
      { id: 'hoy-juega', spanish: 'Hoy juega mi equipo.', english: 'My team plays today.', pronunciation: 'HOY JUE-ga mi e-QUI-po.', context: 'Tell your family about game day.', acceptableAnswers: ['Hoy juega mi equipo', 'Mi equipo juega hoy'] },
      { id: 'contra-giants', spanish: 'Jugamos contra los Gigantes.', english: 'We’re playing against the Giants.', pronunciation: 'ju-GA-mos CON-tra los gi-GAN-tes.', context: 'Name the opponent. This example describes a matchup against the New York Giants.', note: 'Los Gigantes de Nueva York is the Spanish name for the New York Giants. The English team name is accepted too.', acceptableAnswers: ['Jugamos contra los Gigantes', 'Jugamos contra los Giants', 'Estamos jugando contra los Gigantes', 'Estamos jugando contra los Giants'] },
      { id: 'cuantos-puntos', spanish: '¿Cuántos puntos tenemos?', english: 'How many points do we have?', pronunciation: '¿CUÁN-tos PUN-tos te-NE-mos?', context: 'Check the scoreboard with a teammate.' },
      { id: 'no-te-rindas', spanish: 'No te rindas.', english: 'Don’t give up.', pronunciation: 'NO te RIN-das.', context: 'Encourage someone after a difficult play.' },
      { id: 'ganamos-juntos', spanish: 'Ganamos juntos.', english: 'We win together.', pronunciation: 'ga-NA-mos JUN-tos.', context: 'Celebrate teamwork.', note: 'Juntas can describe a group of girls or women.', acceptableAnswers: ['Ganamos juntos', 'Ganamos juntas'] },
      { id: 'jugamos-otra-vez', spanish: '¿Jugamos otra vez?', english: 'Shall we play again?', pronunciation: '¿ju-GA-mos O-tra VEZ?', context: 'Invite everyone back for another game.' },
    ],
  },
];

export const ALL_PHRASES: Phrase[] = LESSONS.flatMap((lesson) => lesson.phrases);
