const subjects = [
  {
    name: 'Mathematics',
    category: 'Numbers & patterns',
    description: 'Build confidence with numbers, algebra, and geometry.',
    color: 'violet',
    icon: 'Pi',
    notes: [
      {
        title: 'A friendly guide to fractions',
        summary: 'Understand equivalent fractions, simplifying, and comparing values.',
        minutes: 6,
        content: `Fractions describe equal parts of a whole. In 3/4, the numerator (3) counts the parts you have and the denominator (4) tells how many equal parts make one whole.\n\nEquivalent fractions\nMultiply or divide the numerator and denominator by the same non-zero number to make an equivalent fraction. For example, 1/2 = 2/4 = 4/8. The value stays the same because the parts are being split into smaller pieces at the same time.\n\nSimplifying\nFind the greatest common factor of the numerator and denominator, then divide both by it. 12/18 simplifies to 2/3 because both 12 and 18 divide by 6.\n\nComparing fractions\nTo compare 2/3 and 3/5, use a common denominator: 2/3 = 10/15 and 3/5 = 9/15. Therefore 2/3 is greater. You can also compare decimals when the denominators are awkward.\n\nQuick check: simplify 15/25. Divide both numbers by 5 to get 3/5.`,
      },
      {
        title: 'Algebra: solving one-step equations',
        summary: 'Use inverse operations to find an unknown while keeping both sides balanced.',
        minutes: 5,
        content: `An equation says that two expressions have the same value. The equals sign is like a balance: whatever you do to one side, you must do to the other.\n\nUndo addition and subtraction\nFor x + 7 = 19, subtract 7 from both sides. This gives x = 12. Check: 12 + 7 = 19.\n\nUndo multiplication and division\nFor 4x = 28, divide both sides by 4. This gives x = 7. For x/3 = 5, multiply both sides by 3 to get x = 15.\n\nA reliable routine\n1. Identify the operation applied to the variable.\n2. Apply its inverse to both sides.\n3. Check your answer in the original equation.\n\nRemember: inverse pairs are addition/subtraction and multiplication/division.`,
      },
    ],
    quiz: {
      title: 'Fractions & equations',
      description: 'A quick check on equivalent fractions and solving for x.',
      duration: 8,
      questions: [
        ['Which fraction is equivalent to 1/2?', '2/3', '3/8', '4/8', '5/8', 'C', 'Multiply the numerator and denominator of 1/2 by 4 to get 4/8.'],
        ['What is 15/25 in simplest form?', '3/5', '5/8', '2/5', '1/5', 'A', 'The greatest common factor is 5. Dividing both parts by 5 gives 3/5.'],
        ['Solve: x + 9 = 16.', 'x = 25', 'x = 7', 'x = 8', 'x = 6', 'B', 'Subtract 9 from both sides: x = 16 - 9 = 7.'],
      ],
    },
  },
  {
    name: 'Biology',
    category: 'Life sciences',
    description: 'Explore cells, ecosystems, and the living world.',
    color: 'emerald',
    icon: 'Leaf',
    notes: [
      {
        title: 'The cell: life’s tiny building block',
        summary: 'Meet the structures that help plant and animal cells stay alive.',
        minutes: 7,
        content: `All living things are made of cells. Some organisms have just one cell, while plants and animals have many specialized cells working together.\n\nParts shared by plant and animal cells\nThe cell membrane controls what enters and leaves. The cytoplasm is where many chemical reactions happen. The nucleus stores genetic information and helps control the cell’s activities.\n\nPlant cell features\nPlant cells have a cell wall for extra support, chloroplasts that capture light for photosynthesis, and a large permanent vacuole containing cell sap. Animal cells do not have a cell wall or chloroplasts.\n\nCells to tissues to organs\nSimilar cells work together as tissues. Different tissues form organs, and organs work together in organ systems. For example, muscle cells form muscle tissue that helps the heart pump blood.`,
      },
      {
        title: 'Food chains and energy flow',
        summary: 'Trace how energy moves from producers through an ecosystem.',
        minutes: 5,
        content: `A food chain shows how energy passes from one organism to another. Arrows point in the direction energy moves—from the food to the organism that eats it.\n\nProducers and consumers\nGreen plants and algae are producers because they make food using sunlight through photosynthesis. Animals are consumers: herbivores eat plants, carnivores eat animals, and omnivores eat both.\n\nExample: grass → grasshopper → frog → snake. The grass is the producer. Each other organism is a consumer at a different feeding level.\n\nEnergy is lost at each step as heat, movement, and waste, so less energy is available to organisms higher in the chain. Decomposers such as fungi and bacteria break down dead material and return nutrients to the environment.`,
      },
    ],
    quiz: {
      title: 'Cells & ecosystems',
      description: 'Review cell structures and the movement of energy.',
      duration: 8,
      questions: [
        ['Which structure controls what enters and leaves a cell?', 'Nucleus', 'Cell membrane', 'Chloroplast', 'Vacuole', 'B', 'The cell membrane regulates the movement of substances into and out of the cell.'],
        ['What is the main role of chloroplasts?', 'Release energy from food', 'Store genetic information', 'Capture light for photosynthesis', 'Control cell entry', 'C', 'Chloroplasts contain chlorophyll, which captures light energy for photosynthesis.'],
        ['In a food chain, what does an arrow show?', 'The direction energy moves', 'The largest organism', 'Where animals live', 'The amount of water', 'A', 'Arrows point from the food toward the organism that eats it.'],
      ],
    },
  },
  {
    name: 'Physics',
    category: 'Forces & energy',
    description: 'Make sense of motion, forces, light, and energy.',
    color: 'sky',
    icon: 'Orbit',
    notes: [
      {
        title: 'Speed, distance, and time',
        summary: 'Connect the three quantities used to describe how fast something moves.',
        minutes: 5,
        content: `Speed tells us how much distance is covered in a certain amount of time. The basic relationship is speed = distance ÷ time.\n\nRearranging the relationship gives distance = speed × time and time = distance ÷ speed. A useful triangle has distance at the top and speed and time underneath.\n\nExample: a cyclist travels 36 kilometres in 2 hours. Speed = 36 ÷ 2 = 18 km/h. Keep units consistent: convert minutes to hours before calculating in km/h.\n\nAverage speed uses total distance divided by total time. It does not tell you how fast the object was moving at every instant.`,
      },
      {
        title: 'Forces and balanced motion',
        summary: 'Learn how pushes and pulls change an object’s movement.',
        minutes: 6,
        content: `A force is a push or a pull, measured in newtons (N). Forces can change an object’s speed, direction, or shape.\n\nWhen forces are balanced, the resultant force is zero. An object at rest remains at rest, and a moving object continues at constant speed in a straight line.\n\nWhen forces are unbalanced, there is a non-zero resultant force and the object accelerates. Acceleration can mean speeding up, slowing down, or changing direction.\n\nFriction acts against motion between surfaces. Air resistance is a type of friction that acts on objects moving through air.`,
      },
    ],
    quiz: {
      title: 'Motion & forces',
      description: 'Practise speed calculations and ideas about forces.',
      duration: 8,
      questions: [
        ['A runner covers 100 m in 20 s. What is the average speed?', '2 m/s', '5 m/s', '20 m/s', '80 m/s', 'B', 'Speed = distance ÷ time = 100 ÷ 20 = 5 m/s.'],
        ['What is the unit of force?', 'Joule', 'Watt', 'Newton', 'Metre', 'C', 'Force is measured in newtons (N).'],
        ['What is the resultant force when forces are balanced?', 'Zero', 'One newton', 'Always upward', 'The object stops immediately', 'A', 'Balanced forces cancel, so the resultant force is zero.'],
      ],
    },
  },
  {
    name: 'Chemistry',
    category: 'Matter & reactions',
    description: 'Discover atoms, materials, mixtures, and reactions.',
    color: 'amber',
    icon: 'FlaskConical',
    notes: [
      {
        title: 'Atoms, elements, and compounds',
        summary: 'Tell apart the basic particles and substances they form.',
        minutes: 6,
        content: `Everything is made from atoms. An atom has a small central nucleus containing protons and neutrons, with electrons around it.\n\nAn element contains only one type of atom. Oxygen and iron are examples. The periodic table organizes elements by their atomic structure and properties.\n\nA compound forms when atoms of two or more different elements are chemically joined in a fixed ratio. Water (H₂O) contains hydrogen and oxygen atoms bonded together.\n\nA mixture contains different substances together but they are not chemically bonded. The substances in a mixture can often be separated by physical methods such as filtering or evaporation.`,
      },
      {
        title: 'Separating mixtures',
        summary: 'Choose a useful method to separate the parts of a mixture.',
        minutes: 5,
        content: `Filtration separates an insoluble solid from a liquid. The liquid passes through the filter paper; the solid remains behind as residue.\n\nEvaporation can recover a dissolved solid from a solution. Heat the solution so the solvent evaporates, leaving the solute behind. Crystallization uses controlled cooling or evaporation to grow purer crystals.\n\nDistillation separates liquids with different boiling points, or recovers a solvent from a solution. The substance with the lower boiling point evaporates first, then condenses in a cooler part of the apparatus.\n\nChoose a method based on the properties that differ: particle size, solubility, or boiling point.`,
      },
    ],
    quiz: {
      title: 'Matter & mixtures',
      description: 'Check your understanding of atoms and separation methods.',
      duration: 8,
      questions: [
        ['What is an element?', 'A substance with one type of atom', 'Any liquid', 'A mixture of compounds', 'A substance made only of neutrons', 'A', 'An element contains only one type of atom.'],
        ['How can sand be separated from water?', 'Distillation', 'Filtration', 'Chromatography', 'Freezing', 'B', 'Sand is insoluble, so it can be trapped by filter paper.'],
        ['What is true of a compound?', 'Its substances are physically mixed', 'It contains only one atom', 'Different elements are chemically joined', 'It can always be filtered', 'C', 'A compound consists of different elements chemically bonded in a fixed ratio.'],
      ],
    },
  },
  {
    name: 'English',
    category: 'Reading & writing',
    description: 'Grow your reading, vocabulary, and writing skills.',
    color: 'rose',
    icon: 'PenLine',
    notes: [
      {
        title: 'Finding the main idea',
        summary: 'Read actively and distinguish a text’s central point from its details.',
        minutes: 5,
        content: `The main idea is the most important point an author wants the reader to understand. Supporting details give evidence, examples, or explanations for that point.\n\nA practical reading routine\n1. Read the title and first paragraph to predict the topic.\n2. Notice repeated ideas and topic sentences.\n3. Ask, “What do these details have in common?”\n4. Summarize the text in one sentence using your own words.\n\nDo not choose a detail that appears only once as the main idea. A strong summary includes the central point without adding your personal opinion or copying a whole paragraph.`,
      },
      {
        title: 'Building a clear paragraph',
        summary: 'Organize a focused paragraph with a point, evidence, and explanation.',
        minutes: 6,
        content: `A clear paragraph develops one main point. Start with a topic sentence that tells the reader the focus.\n\nAdd evidence or examples that support your point. In an essay about a story, evidence might be a short quotation or a specific event. Introduce quotations so they fit naturally into your sentence.\n\nExplain how each piece of evidence supports the point. Do not leave a quotation to speak for itself. Use linking words such as “because,” “for example,” and “therefore” to show how your ideas connect.\n\nFinish by linking the explanation back to the topic sentence or preparing the reader for the next paragraph.`,
      },
    ],
    quiz: {
      title: 'Reading & writing',
      description: 'Practise identifying main ideas and paragraph structure.',
      duration: 8,
      questions: [
        ['What is a paragraph’s topic sentence for?', 'To introduce its main point', 'To list every detail', 'To quote the conclusion', 'To change the subject', 'A', 'The topic sentence introduces the paragraph’s focus or main point.'],
        ['Which is the best way to support a point about a story?', 'A specific example from the text', 'An unrelated opinion', 'A new topic', 'A dictionary cover', 'A', 'Relevant examples or quotations from the text provide evidence for a point.'],
        ['A good summary should mostly include…', 'The central idea in your own words', 'Every sentence copied', 'Only your opinion', 'A list of difficult words', 'A', 'A summary gives the central idea concisely and in your own words.'],
      ],
    },
  },
]

export async function seedDatabase(connection) {
  for (const [subjectIndex, subject] of subjects.entries()) {
    await connection.execute(
      'INSERT IGNORE INTO subjects (name, category, description, color, icon, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
      [subject.name, subject.category, subject.description, subject.color, subject.icon, subjectIndex + 1],
    )
    const [[subjectRow]] = await connection.execute('SELECT id FROM subjects WHERE name = ?', [subject.name])

    for (const [noteIndex, note] of subject.notes.entries()) {
      const [existing] = await connection.execute('SELECT id FROM notes WHERE subject_id = ? AND title = ?', [subjectRow.id, note.title])
      if (!existing.length) {
        await connection.execute(
          'INSERT INTO notes (subject_id, title, summary, content, read_minutes, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
          [subjectRow.id, note.title, note.summary, note.content, note.minutes, noteIndex + 1],
        )
      }
    }

    const [existingQuiz] = await connection.execute('SELECT id FROM quizzes WHERE subject_id = ? AND title = ?', [subjectRow.id, subject.quiz.title])
    let quizId
    if (existingQuiz.length) {
      quizId = existingQuiz[0].id
    } else {
      const [quizResult] = await connection.execute(
        'INSERT INTO quizzes (subject_id, title, description, duration_minutes, sort_order) VALUES (?, ?, ?, ?, 1)',
        [subjectRow.id, subject.quiz.title, subject.quiz.description, subject.quiz.duration],
      )
      quizId = quizResult.insertId
    }
    for (const [questionIndex, question] of subject.quiz.questions.entries()) {
      const sortOrder = questionIndex + 1
      const [existingQuestion] = await connection.execute(
        'SELECT id FROM quiz_questions WHERE quiz_id = ? AND sort_order = ?',
        [quizId, sortOrder],
      )
      if (existingQuestion.length) continue
      await connection.execute(
        `INSERT INTO quiz_questions
          (quiz_id, prompt, choice_a, choice_b, choice_c, choice_d, correct_answer, explanation, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [quizId, ...question, sortOrder],
      )
    }
  }
}
