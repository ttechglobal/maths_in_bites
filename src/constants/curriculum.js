// src/constants/curriculum.js
// ============================================================
// The master curriculum data.
//
// SHAPE PER TOPIC:
//   name        — topic name (seeded to DB as-is)
//   icon        — emoji
//   description — brief summary for display
//   subtopics   — curriculum's own subtopics (AI uses these as HINTS,
//                 not the final output)
//   objectives  — what students should be able to do by the end
//                 (both subtopics + objectives go to AI as context
//                  so it generates better, more granular subtopics)
//
// The AI takes all of this and produces progressive, bite-sized
// learning steps — e.g. "Quadratic Equations" as a curriculum
// hint becomes 6-8 smaller lessons building from scratch.
// ============================================================

export const SCHOOL_CLASSES = ['JSS1','JSS2','JSS3','SS1','SS2','SS3'];
export const EXAM_TYPES     = ['WAEC','JAMB','NECO','GCE'];

export const CURRICULUM = {

  // ── SS2 ──────────────────────────────────────────────────────
  SS2: [
    {
      name: 'Algebra',
      icon: '🔢',
      description: 'Solving equations, inequalities and expressions',
      subtopics: ['Linear Equations', 'Quadratic Equations', 'Simultaneous Equations', 'Inequalities', 'Polynomials'],
      objectives: [
        'Solve linear equations in one variable',
        'Solve quadratic equations by factorisation and formula',
        'Solve simultaneous equations by substitution and elimination',
        'Represent and solve linear inequalities on a number line',
        'Perform operations on polynomials',
      ],
    },
    {
      name: 'Geometry',
      icon: '📐',
      description: 'Shapes, angles, lines and circle theorems',
      subtopics: ['Angles & Lines', 'Triangles', 'Quadrilaterals', 'Circle Theorems', 'Loci & Construction'],
      objectives: [
        'Identify and calculate angles on lines and in shapes',
        'Apply properties of triangles and quadrilaterals',
        'Apply circle theorems to find unknown angles and lengths',
        'Construct geometric shapes and loci accurately',
      ],
    },
    {
      name: 'Statistics & Probability',
      icon: '📊',
      description: 'Data analysis, averages, and chance',
      subtopics: ['Mean, Median, Mode', 'Frequency Tables', 'Histograms & Bar Charts', 'Probability Basics', 'Combined Events'],
      objectives: [
        'Calculate mean, median, mode and range from data sets',
        'Construct and interpret frequency tables and histograms',
        'Calculate simple and combined probabilities',
        'Distinguish between theoretical and experimental probability',
      ],
    },
    {
      name: 'Trigonometry',
      icon: '📡',
      description: 'Ratios, rules and applications in triangles',
      subtopics: ['SOH-CAH-TOA', 'Angles of Elevation & Depression', 'Sine Rule', 'Cosine Rule', 'Bearings'],
      objectives: [
        'Use sine, cosine and tangent ratios in right-angled triangles',
        'Solve real-world problems involving angles of elevation and depression',
        'Apply the sine and cosine rules to non-right-angled triangles',
        'Solve problems involving bearings and directions',
      ],
    },
    {
      name: 'Number & Numeration',
      icon: '🔣',
      description: 'Indices, logarithms, surds and number systems',
      subtopics: ['Indices & Laws of Indices', 'Standard Form', 'Logarithms', 'Surds', 'Number Bases'],
      objectives: [
        'Apply laws of indices to simplify expressions',
        'Convert numbers to and from standard form',
        'Evaluate and apply logarithms',
        'Simplify and rationalise surds',
        'Convert between number bases (2, 8, 10, 16)',
      ],
    },
    {
      name: 'Mensuration',
      icon: '📏',
      description: 'Perimeter, area and volume of 2D and 3D shapes',
      subtopics: ['Perimeter & Area of Plane Shapes', 'Area of Sectors & Segments', 'Surface Area of Solids', 'Volume of Solids', 'Similar Shapes'],
      objectives: [
        'Calculate perimeter and area of triangles, circles, quadrilaterals',
        'Calculate arc length, sector area and segment area',
        'Find surface area of prisms, cylinders, cones and spheres',
        'Calculate volume of 3D shapes',
        'Apply ratios of similar shapes for area and volume',
      ],
    },
  ],

  // ── SS1 ──────────────────────────────────────────────────────
  SS1: [
    {
      name: 'Number Theory',
      icon: '🔢',
      description: 'Sets, fractions, decimals and percentages',
      subtopics: ['Sets & Set Notation', 'Venn Diagrams', 'Fractions & Decimals', 'Percentages', 'Ratio & Proportion'],
      objectives: [
        'Define sets and use set notation correctly',
        'Solve problems using Venn diagrams with 2 and 3 sets',
        'Perform operations with fractions and decimals',
        'Solve percentage problems including profit/loss and simple interest',
        'Apply ratio and proportion in real-world situations',
      ],
    },
    {
      name: 'Algebraic Expressions',
      icon: '🔠',
      description: 'Simplifying, expanding and factorising expressions',
      subtopics: ['Algebraic Notation', 'Expanding Brackets', 'Factorisation', 'Algebraic Fractions', 'Formulae & Substitution'],
      objectives: [
        'Use correct algebraic notation and simplify expressions',
        'Expand single and double brackets',
        'Factorise expressions by common factors and by grouping',
        'Simplify algebraic fractions',
        'Substitute values into formulae and rearrange formulae',
      ],
    },
    {
      name: 'Linear Graphs & Equations',
      icon: '📈',
      description: 'Straight-line graphs, gradient, and solving equations',
      subtopics: ['Coordinates & Plotting', 'Gradient & y-intercept', 'Equation of a Line y=mx+c', 'Parallel & Perpendicular Lines', 'Solving Linear Equations'],
      objectives: [
        'Plot points and draw straight-line graphs',
        'Calculate gradient and y-intercept from a graph or equation',
        'Write and interpret the equation of a straight line',
        'Identify parallel and perpendicular lines from their equations',
        'Solve linear equations including those with fractions',
      ],
    },
    {
      name: 'Geometry: Lines & Angles',
      icon: '📐',
      description: 'Angle types, parallel lines, and polygon properties',
      subtopics: ['Types of Angles', 'Angles on Parallel Lines', 'Properties of Triangles', 'Properties of Quadrilaterals', 'Interior & Exterior Angles of Polygons'],
      objectives: [
        'Identify and measure different types of angles',
        'Apply angle rules for parallel lines cut by a transversal',
        'Use triangle and quadrilateral properties to find unknown angles',
        'Calculate interior and exterior angles of regular polygons',
      ],
    },
  ],

  // ── SS3 / WAEC ────────────────────────────────────────────────
  SS3: [
    {
      name: 'Further Algebra',
      icon: '🔢',
      description: 'Advanced equations, sequences and functions',
      subtopics: ['Quadratic Equations & Discriminant', 'Simultaneous Equations (Linear & Non-linear)', 'Arithmetic & Geometric Progressions', 'Functions & Mappings', 'Partial Fractions'],
      objectives: [
        'Solve quadratic equations and interpret the discriminant',
        'Solve linear/non-linear simultaneous equations',
        'Find nth term and sum of APs and GPs',
        'Understand function notation, domain and range',
        'Decompose rational expressions into partial fractions',
      ],
    },
    {
      name: 'Coordinate Geometry',
      icon: '📍',
      description: 'Lines, circles and curves on the coordinate plane',
      subtopics: ['Midpoint & Distance Formula', 'Gradient & Equations of Lines', 'Circle Equations', 'Tangent to a Circle', 'Locus Problems'],
      objectives: [
        'Use midpoint and distance formula',
        'Find and use equations of straight lines',
        'Write and interpret equations of circles',
        'Find tangent and normal to a circle at a given point',
        'Describe loci as equations',
      ],
    },
    {
      name: 'Vectors',
      icon: '➡️',
      description: 'Vector representation, operations, and geometry',
      subtopics: ['Vector Notation & Representation', 'Addition & Subtraction of Vectors', 'Scalar Multiplication', 'Position Vectors', 'Vector Geometry Proofs'],
      objectives: [
        'Represent vectors in column form and diagram form',
        'Add, subtract and multiply vectors by a scalar',
        'Use position vectors to find resultants and midpoints',
        'Prove geometric results using vectors',
      ],
    },
    {
      name: 'Calculus Foundations',
      icon: '∫',
      description: 'Introduction to differentiation and integration',
      subtopics: ['Concept of a Limit', 'Rules of Differentiation', 'Applications of Differentiation', 'Integration as Anti-differentiation', 'Definite Integrals & Area'],
      objectives: [
        'Understand the concept of a derivative as a rate of change',
        'Differentiate polynomials, products, and quotients',
        'Find turning points and solve optimisation problems',
        'Integrate polynomial expressions',
        'Use definite integrals to find areas under curves',
      ],
    },
  ],

  // ── WAEC ──────────────────────────────────────────────────────
  WAEC: [
    {
      name: 'Number & Numeration',
      icon: '🔣',
      description: 'Fractions, indices, logarithms, surds and number bases',
      subtopics: ['Fractions, Decimals & Percentages', 'Indices & Laws', 'Logarithms', 'Surds', 'Number Bases'],
      objectives: [
        'Perform all operations on fractions, decimals and percentages',
        'Apply laws of indices and simplify exponential expressions',
        'Evaluate logarithms and apply log laws',
        'Simplify and rationalise surds',
        'Convert and compute in different number bases',
      ],
    },
    {
      name: 'Algebra',
      icon: '🔢',
      description: 'Equations, inequalities, sequences and polynomials',
      subtopics: ['Linear & Quadratic Equations', 'Simultaneous Equations', 'Inequalities', 'Polynomials', 'Sequences & Series'],
      objectives: [
        'Solve linear, quadratic and simultaneous equations',
        'Solve linear inequalities and represent on a number line',
        'Perform operations on polynomials',
        'Find nth terms and sums of APs and GPs',
      ],
    },
    {
      name: 'Mensuration',
      icon: '📏',
      description: 'Perimeter, area, surface area and volume',
      subtopics: ['Plane Shapes: Perimeter & Area', 'Circles: Arc, Sector & Segment', 'Surface Area of 3D Shapes', 'Volume of 3D Shapes', 'Similar Shapes'],
      objectives: [
        'Calculate perimeter and area of all plane shapes',
        'Find arc length, sector area, and segment area',
        'Calculate surface area and volume of prisms, cylinders, cones, spheres',
        'Apply properties of similar shapes to area and volume problems',
      ],
    },
    {
      name: 'Geometry & Trigonometry',
      icon: '📐',
      description: 'Circle theorems, angles, constructions, trig rules',
      subtopics: ['Circle Theorems', 'Triangles & Polygons', 'Trigonometric Ratios', 'Sine & Cosine Rule', 'Bearings'],
      objectives: [
        'Apply all circle theorems to find unknown angles',
        'Prove and use properties of triangles and polygons',
        'Use SOHCAHTOA in right-angled triangles',
        'Apply the sine and cosine rules',
        'Solve bearing problems using trigonometry',
      ],
    },
    {
      name: 'Statistics & Probability',
      icon: '📊',
      description: 'Data collection, analysis, and probability',
      subtopics: ['Frequency Tables & Histograms', 'Measures of Central Tendency', 'Measures of Dispersion', 'Probability', 'Cumulative Frequency & Box Plots'],
      objectives: [
        'Construct and interpret frequency tables and histograms',
        'Calculate mean, median, mode for grouped and ungrouped data',
        'Calculate range, variance, and standard deviation',
        'Calculate simple and combined probabilities',
        'Draw and interpret cumulative frequency curves and box plots',
      ],
    },
  ],

  // ── JAMB ──────────────────────────────────────────────────────
  JAMB: [
    {
      name: 'Sets & Logic',
      icon: '🔵',
      description: 'Set operations, Venn diagrams, and logical reasoning',
      subtopics: ['Set Notation & Operations', 'Venn Diagrams', 'Logic Statements', 'Truth Tables'],
      objectives: [
        'Perform union, intersection, complement on sets',
        'Solve Venn diagram problems with 2 and 3 sets',
        'Identify valid logical statements',
        'Construct and interpret truth tables',
      ],
    },
    {
      name: 'Algebra & Functions',
      icon: '🔢',
      description: 'Equations, functions, polynomials and sequences',
      subtopics: ['Quadratic Equations', 'Functions & Graphs', 'Polynomials', 'Partial Fractions', 'Sequences & Series'],
      objectives: [
        'Solve quadratic equations by all methods',
        'Identify domain, range and graph of functions',
        'Perform operations on polynomials and find roots',
        'Decompose rational expressions into partial fractions',
        'Find nth terms and sums of APs and GPs',
      ],
    },
    {
      name: 'Calculus',
      icon: '∫',
      description: 'Differentiation, integration, and their applications',
      subtopics: ['Differentiation', 'Applications of Differentiation', 'Integration', 'Definite Integrals'],
      objectives: [
        'Differentiate polynomial and composite functions',
        'Use differentiation to find tangents, normals and turning points',
        'Integrate polynomial functions',
        'Apply definite integrals to area problems',
      ],
    },
    {
      name: 'Statistics & Probability',
      icon: '📊',
      description: 'Data, averages, spread, and probability',
      subtopics: ['Frequency Distributions', 'Measures of Location & Dispersion', 'Probability', 'Permutations & Combinations'],
      objectives: [
        'Calculate mean, median, mode from frequency distributions',
        'Calculate range, variance, standard deviation',
        'Compute probabilities of simple and combined events',
        'Apply permutations and combinations to counting problems',
      ],
    },
    {
      name: 'Coordinate Geometry & Trigonometry',
      icon: '📍',
      description: 'Lines, circles, trig functions and identities',
      subtopics: ['Straight Lines & Distance', 'Equation of a Circle', 'Trigonometric Functions', 'Trig Identities', 'Sine & Cosine Rule'],
      objectives: [
        'Find equations of lines, midpoints and distances',
        'Write and interpret circle equations',
        'Evaluate and graph trig functions',
        'Prove and apply basic trig identities',
        'Solve triangles using sine and cosine rule',
      ],
    },
  ],

  // ── JSS3 ──────────────────────────────────────────────────────
  JSS3: [
    {
      name: 'Number & Operations',
      icon: '🔢',
      description: 'Integers, fractions, percentages, and approximation',
      subtopics: ['Integers & BODMAS', 'Fractions & Decimals', 'Percentages', 'Approximation & Estimation', 'Standard Form Intro'],
      objectives: [
        'Perform operations on integers using BODMAS',
        'Add, subtract, multiply and divide fractions and decimals',
        'Solve percentage increase/decrease problems',
        'Round numbers and estimate answers',
        'Write large and small numbers in standard form',
      ],
    },
    {
      name: 'Algebra Basics',
      icon: '🔠',
      description: 'Expressions, simple equations, and substitution',
      subtopics: ['Algebraic Notation', 'Substitution', 'Simple Equations', 'Word Problems', 'Simple Formulae'],
      objectives: [
        'Use letters to represent unknown quantities',
        'Substitute values into expressions',
        'Solve simple one-step and two-step equations',
        'Translate word problems into equations',
        'Use simple formulae to calculate values',
      ],
    },
    {
      name: 'Geometry',
      icon: '📐',
      description: 'Angles, triangles, quadrilaterals, and constructions',
      subtopics: ['Angle Types & Measurement', 'Angles in Triangles', 'Properties of Quadrilaterals', 'Constructions', 'Bearings Intro'],
      objectives: [
        'Measure and classify angles',
        'Apply angle sum properties in triangles',
        'Identify and use properties of quadrilaterals',
        'Construct triangles and bisect angles',
        'Read and give bearings',
      ],
    },
  ],
};
