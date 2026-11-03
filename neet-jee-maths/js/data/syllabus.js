// Syllabus: units → chapters, each with concise notes and key formulas.
// Formulas double as spaced-repetition flashcards.
// exams: 'main' = JEE Main, 'adv' = JEE Advanced, 'neet' = maths used in NEET Physics.
const r = String.raw;

export const UNITS = [
  { id: 'algebra', name: 'Algebra', icon: '∑' },
  { id: 'trig', name: 'Trigonometry', icon: 'θ' },
  { id: 'calculus', name: 'Calculus', icon: '∫' },
  { id: 'coord', name: 'Coordinate Geometry', icon: '⌖' },
  { id: 'vector3d', name: 'Vectors & 3D', icon: '→' },
  { id: 'statprob', name: 'Statistics & Probability', icon: '⚄' },
  { id: 'basics', name: 'Basic Maths for Physics', icon: '⚛' },
];

export const CHAPTERS = [
  // ───────────────────────── Algebra
  {
    id: 'sets-functions', unit: 'algebra', name: 'Sets, Relations & Functions', exams: ['main', 'adv'], weight: 'Medium',
    notes: [
      r`A relation $R$ on $A$ is an equivalence relation when it is reflexive, symmetric and transitive.`,
      r`A function is one-one (injective) if $f(x_1)=f(x_2)\Rightarrow x_1=x_2$, onto (surjective) if its range equals its codomain.`,
      r`Domain checklist: denominators $\ne 0$, even roots of non-negative quantities, $\log$ arguments $>0$ (and bases $>0,\ \ne 1$).`,
      r`$f\circ g$ means "apply $g$ first". Inverse exists only for bijections; graph of $f^{-1}$ is the mirror image of $f$ in $y=x$.`,
    ],
    formulas: [
      { name: 'Union of two sets', tex: r`n(A\cup B)=n(A)+n(B)-n(A\cap B)` },
      { name: 'Number of functions A → B', tex: r`n(B)^{\,n(A)}` },
      { name: 'One-one functions A → B (|A|=m ≤ |B|=n)', tex: r`{}^{n}P_{m}=\dfrac{n!}{(n-m)!}` },
      { name: 'Relations on a set with n elements', tex: r`2^{n^2}` },
      { name: 'Reflexive relations on n elements', tex: r`2^{n^2-n}` },
      { name: 'Symmetric relations on n elements', tex: r`2^{n(n+1)/2}` },
    ],
  },
  {
    id: 'complex', unit: 'algebra', name: 'Complex Numbers', exams: ['main', 'adv'], weight: 'High',
    notes: [
      r`$z=x+iy=r(\cos\theta+i\sin\theta)=re^{i\theta}$, with $r=|z|$ and $\theta=\arg z\in(-\pi,\pi]$ (principal value).`,
      r`$|z_1z_2|=|z_1||z_2|$, $\arg(z_1z_2)=\arg z_1+\arg z_2 \pmod{2\pi}$, and $z\bar z=|z|^2$.`,
      r`Cube roots of unity: $1,\omega,\omega^2$ with $1+\omega+\omega^2=0$ and $\omega^3=1$.`,
      r`Locus tips: $|z-z_1|=|z-z_2|$ is the perpendicular bisector; $|z-z_0|=r$ is a circle.`,
    ],
    formulas: [
      { name: 'Modulus', tex: r`|x+iy|=\sqrt{x^2+y^2}` },
      { name: 'De Moivre’s theorem', tex: r`(\cos\theta+i\sin\theta)^n=\cos n\theta+i\sin n\theta` },
      { name: 'Powers of i', tex: r`i^{4k}=1,\ i^{4k+1}=i,\ i^{4k+2}=-1,\ i^{4k+3}=-i` },
      { name: 'Cube roots of unity', tex: r`\omega=\tfrac{-1+i\sqrt3}{2},\quad 1+\omega+\omega^2=0` },
      { name: 'Triangle inequality', tex: r`\big||z_1|-|z_2|\big|\le|z_1+z_2|\le|z_1|+|z_2|` },
    ],
  },
  {
    id: 'quadratic', unit: 'algebra', name: 'Quadratic Equations', exams: ['main', 'adv', 'neet'], weight: 'High',
    notes: [
      r`For $ax^2+bx+c=0$: $\alpha+\beta=-\tfrac ba$, $\alpha\beta=\tfrac ca$, discriminant $D=b^2-4ac$.`,
      r`$D>0$: real distinct; $D=0$: real equal; $D<0$: complex conjugate pair (for real coefficients).`,
      r`Equation with roots reciprocal to those of $ax^2+bx+c=0$: $cx^2+bx+a=0$.`,
      r`Minimum of $ax^2+bx+c$ ($a>0$) is $-\tfrac{D}{4a}$ at $x=-\tfrac{b}{2a}$.`,
    ],
    formulas: [
      { name: 'Quadratic formula', tex: r`x=\dfrac{-b\pm\sqrt{b^2-4ac}}{2a}` },
      { name: 'Sum and product of roots', tex: r`\alpha+\beta=-\dfrac ba,\quad \alpha\beta=\dfrac ca` },
      { name: 'Sum of squares of roots', tex: r`\alpha^2+\beta^2=(\alpha+\beta)^2-2\alpha\beta` },
      { name: 'Difference of roots', tex: r`|\alpha-\beta|=\dfrac{\sqrt{D}}{|a|}` },
      { name: 'Extreme value of a quadratic', tex: r`-\dfrac{D}{4a}\ \text{ at } x=-\dfrac{b}{2a}` },
    ],
  },
  {
    id: 'sequences', unit: 'algebra', name: 'Sequences & Series', exams: ['main', 'adv'], weight: 'High',
    notes: [
      r`AP: constant difference $d$. GP: constant ratio $r$. HP: reciprocals form an AP.`,
      r`For positive numbers, $\text{AM}\ge\text{GM}\ge\text{HM}$; for two numbers $\text{GM}^2=\text{AM}\cdot\text{HM}$.`,
      r`Telescoping: write $\tfrac{1}{k(k+1)}=\tfrac1k-\tfrac1{k+1}$ and watch the middle cancel.`,
    ],
    formulas: [
      { name: 'n-th term of an AP', tex: r`a_n=a+(n-1)d` },
      { name: 'Sum of n terms of an AP', tex: r`S_n=\dfrac n2\big[2a+(n-1)d\big]` },
      { name: 'Sum of n terms of a GP', tex: r`S_n=\dfrac{a(r^n-1)}{r-1}` },
      { name: 'Infinite GP (|r|<1)', tex: r`S_\infty=\dfrac{a}{1-r}` },
      { name: 'Sum of squares', tex: r`\sum_{k=1}^n k^2=\dfrac{n(n+1)(2n+1)}{6}` },
      { name: 'Sum of cubes', tex: r`\sum_{k=1}^n k^3=\left[\dfrac{n(n+1)}{2}\right]^2` },
    ],
  },
  {
    id: 'pnc', unit: 'algebra', name: 'Permutations & Combinations', exams: ['main', 'adv'], weight: 'Medium',
    notes: [
      r`Order matters → permutation; order does not matter → combination.`,
      r`Arrangements of $n$ objects with $p,q,\dots$ alike: $\dfrac{n!}{p!\,q!\cdots}$.`,
      r`Circular arrangements of $n$ distinct objects: $(n-1)!$ (divide by 2 more if clockwise = anticlockwise, e.g. necklaces).`,
      r`Stars and bars: $n$ identical objects into $r$ distinct boxes: $\binom{n+r-1}{r-1}$.`,
    ],
    formulas: [
      { name: 'Permutations', tex: r`{}^nP_r=\dfrac{n!}{(n-r)!}` },
      { name: 'Combinations', tex: r`{}^nC_r=\dbinom nr=\dfrac{n!}{r!(n-r)!}` },
      { name: 'Pascal’s rule', tex: r`\dbinom nr+\dbinom n{r-1}=\dbinom{n+1}{r}` },
      { name: 'Diagonals of an n-gon', tex: r`\dfrac{n(n-3)}{2}` },
      { name: 'Identical objects into distinct boxes', tex: r`\dbinom{n+r-1}{r-1}` },
    ],
  },
  {
    id: 'binomial', unit: 'algebra', name: 'Binomial Theorem', exams: ['main', 'adv', 'neet'], weight: 'Medium',
    notes: [
      r`General term of $(a+b)^n$: $T_{r+1}=\binom nr a^{n-r}b^r$.`,
      r`For the constant term, set the total power of $x$ in $T_{r+1}$ equal to 0 and solve for $r$.`,
      r`Sum of coefficients: put $x=1$. Sum of even-indexed binomial coefficients $=$ sum of odd-indexed $=2^{n-1}$.`,
      r`Physics approximation: $(1+x)^n\approx1+nx$ when $|x|\ll1$.`,
    ],
    formulas: [
      { name: 'General term', tex: r`T_{r+1}=\dbinom nr a^{\,n-r}b^{\,r}` },
      { name: 'Sum of binomial coefficients', tex: r`\sum_{r=0}^n\dbinom nr=2^n` },
      { name: 'Middle term (n even)', tex: r`T_{\frac n2+1}` },
      { name: 'Binomial approximation', tex: r`(1+x)^n\approx 1+nx\quad(|x|\ll1)` },
    ],
  },
  {
    id: 'matrices', unit: 'algebra', name: 'Matrices & Determinants', exams: ['main', 'adv'], weight: 'High',
    notes: [
      r`$(AB)^T=B^TA^T$, $(AB)^{-1}=B^{-1}A^{-1}$; $A^{-1}=\dfrac{\operatorname{adj}A}{|A|}$ exists iff $|A|\ne0$.`,
      r`A skew-symmetric matrix of odd order has determinant $0$.`,
      r`Cramer's rule: unique solution iff $\Delta\ne0$; if $\Delta=0$ and all $\Delta_i=0$ the system may have infinitely many solutions.`,
    ],
    formulas: [
      { name: '2×2 determinant', tex: r`\begin{vmatrix}a&b\\c&d\end{vmatrix}=ad-bc` },
      { name: 'Scalar multiple (order n)', tex: r`|kA|=k^n|A|` },
      { name: 'Determinant of adjoint (order n)', tex: r`|\operatorname{adj}A|=|A|^{n-1}` },
      { name: 'Inverse', tex: r`A^{-1}=\dfrac{1}{|A|}\operatorname{adj}A` },
      { name: 'Product rule', tex: r`|AB|=|A|\,|B|` },
    ],
  },
  // ───────────────────────── Trigonometry
  {
    id: 'trigonometry', unit: 'trig', name: 'Trigonometry', exams: ['main', 'adv', 'neet'], weight: 'High',
    notes: [
      r`Know the standard values at $0,\tfrac\pi6,\tfrac\pi4,\tfrac\pi3,\tfrac\pi2$ cold — they unlock most problems.`,
      r`$a\sin x+b\cos x$ ranges over $\left[-\sqrt{a^2+b^2},\ \sqrt{a^2+b^2}\right]$.`,
      r`General solutions: $\sin x=\sin\alpha\Rightarrow x=n\pi+(-1)^n\alpha$; $\cos x=\cos\alpha\Rightarrow x=2n\pi\pm\alpha$; $\tan x=\tan\alpha\Rightarrow x=n\pi+\alpha$.`,
      r`Principal ranges: $\sin^{-1}\in[-\tfrac\pi2,\tfrac\pi2]$, $\cos^{-1}\in[0,\pi]$, $\tan^{-1}\in(-\tfrac\pi2,\tfrac\pi2)$.`,
    ],
    formulas: [
      { name: 'Pythagorean identity', tex: r`\sin^2x+\cos^2x=1` },
      { name: 'Sine of a sum', tex: r`\sin(A\pm B)=\sin A\cos B\pm\cos A\sin B` },
      { name: 'Cosine of a sum', tex: r`\cos(A\pm B)=\cos A\cos B\mp\sin A\sin B` },
      { name: 'Tangent of a sum', tex: r`\tan(A+B)=\dfrac{\tan A+\tan B}{1-\tan A\tan B}` },
      { name: 'Double angle (cos)', tex: r`\cos2x=1-2\sin^2x=2\cos^2x-1` },
      { name: 'Sine rule', tex: r`\dfrac{a}{\sin A}=\dfrac{b}{\sin B}=\dfrac{c}{\sin C}=2R` },
      { name: 'Cosine rule', tex: r`\cos C=\dfrac{a^2+b^2-c^2}{2ab}` },
      { name: 'Product of cosines', tex: r`\cos\theta\cos(60^\circ-\theta)\cos(60^\circ+\theta)=\tfrac14\cos3\theta` },
    ],
  },
  // ───────────────────────── Calculus
  {
    id: 'limits', unit: 'calculus', name: 'Limits & Continuity', exams: ['main', 'adv', 'neet'], weight: 'High',
    notes: [
      r`$f$ is continuous at $a$ iff $\lim_{x\to a^-}f=\lim_{x\to a^+}f=f(a)$.`,
      r`For $0/0$ forms: factorise, rationalise, use standard limits, or apply L'Hôpital's rule.`,
      r`For $1^\infty$ forms: $\lim f^g=e^{\lim g\,(f-1)}$.`,
    ],
    formulas: [
      { name: 'Standard sine limit', tex: r`\lim_{x\to0}\dfrac{\sin x}{x}=1` },
      { name: 'Power limit', tex: r`\lim_{x\to a}\dfrac{x^n-a^n}{x-a}=na^{n-1}` },
      { name: 'Exponential limit', tex: r`\lim_{x\to0}\dfrac{e^x-1}{x}=1` },
      { name: '1^∞ form', tex: r`\lim_{x\to\infty}\left(1+\dfrac ax\right)^{bx}=e^{ab}` },
      { name: 'Cosine limit', tex: r`\lim_{x\to0}\dfrac{1-\cos x}{x^2}=\dfrac12` },
    ],
  },
  {
    id: 'differentiation', unit: 'calculus', name: 'Differentiation', exams: ['main', 'adv', 'neet'], weight: 'High',
    notes: [
      r`Chain rule: $\dfrac{d}{dx}f(g(x))=f'(g(x))\,g'(x)$.`,
      r`For $y=u^v$, take logs: $\ln y=v\ln u$, then differentiate implicitly.`,
      r`Parametric: $\dfrac{dy}{dx}=\dfrac{dy/dt}{dx/dt}$.`,
    ],
    formulas: [
      { name: 'Power rule', tex: r`\dfrac{d}{dx}x^n=nx^{n-1}` },
      { name: 'Product rule', tex: r`(uv)'=u'v+uv'` },
      { name: 'Quotient rule', tex: r`\left(\dfrac uv\right)'=\dfrac{u'v-uv'}{v^2}` },
      { name: 'Derivative of tan x', tex: r`\dfrac{d}{dx}\tan x=\sec^2x` },
      { name: 'Derivative of ln x', tex: r`\dfrac{d}{dx}\ln x=\dfrac1x` },
      { name: 'Derivative of inverse tangent', tex: r`\dfrac{d}{dx}\tan^{-1}x=\dfrac{1}{1+x^2}` },
    ],
  },
  {
    id: 'aod', unit: 'calculus', name: 'Applications of Derivatives', exams: ['main', 'adv', 'neet'], weight: 'High',
    notes: [
      r`$f'(x)>0$ on an interval ⇒ $f$ increasing there. Critical points: $f'(x)=0$ or undefined.`,
      r`Second-derivative test: $f'(c)=0,\ f''(c)<0$ ⇒ local maximum; $f''(c)>0$ ⇒ local minimum.`,
      r`Rolle's theorem: $f$ continuous on $[a,b]$, differentiable on $(a,b)$, $f(a)=f(b)$ ⇒ some $c\in(a,b)$ has $f'(c)=0$.`,
    ],
    formulas: [
      { name: 'Tangent at (x₁, y₁)', tex: r`y-y_1=f'(x_1)(x-x_1)` },
      { name: 'Normal at (x₁, y₁)', tex: r`y-y_1=-\dfrac{1}{f'(x_1)}(x-x_1)` },
      { name: 'Mean value theorem', tex: r`f'(c)=\dfrac{f(b)-f(a)}{b-a}` },
      { name: 'Related rates (sphere)', tex: r`\dfrac{dV}{dt}=4\pi r^2\dfrac{dr}{dt}` },
    ],
  },
  {
    id: 'indefinite', unit: 'calculus', name: 'Indefinite Integration', exams: ['main', 'adv', 'neet'], weight: 'Medium',
    notes: [
      r`Integration by parts (ILATE order for choosing $u$): $\int u\,dv=uv-\int v\,du$.`,
      r`If the numerator is the derivative of the denominator: $\int\frac{f'(x)}{f(x)}dx=\ln|f(x)|+C$.`,
      r`$\int e^x\big(f(x)+f'(x)\big)dx=e^xf(x)+C$.`,
    ],
    formulas: [
      { name: 'Power rule (n ≠ −1)', tex: r`\int x^n\,dx=\dfrac{x^{n+1}}{n+1}+C` },
      { name: 'Integral of 1/x', tex: r`\int\dfrac{dx}{x}=\ln|x|+C` },
      { name: 'Standard arctan form', tex: r`\int\dfrac{dx}{x^2+a^2}=\dfrac1a\tan^{-1}\dfrac xa+C` },
      { name: 'Integration by parts', tex: r`\int u\,dv=uv-\int v\,du` },
      { name: 'e^x pattern', tex: r`\int e^x\big(f+f'\big)dx=e^xf(x)+C` },
    ],
  },
  {
    id: 'definite', unit: 'calculus', name: 'Definite Integration & Area', exams: ['main', 'adv', 'neet'], weight: 'High',
    notes: [
      r`King's property $\int_a^bf(x)\,dx=\int_a^bf(a+b-x)\,dx$ often turns a hard integral into "$2I$ = easy".`,
      r`Odd function on $[-a,a]$ integrates to $0$; even function gives $2\int_0^a$.`,
      r`Area between curves: $\int_a^b\big(\text{top}-\text{bottom}\big)\,dx$.`,
    ],
    formulas: [
      { name: 'Fundamental theorem', tex: r`\int_a^b f(x)\,dx=F(b)-F(a)` },
      { name: 'King’s property', tex: r`\int_a^b f(x)\,dx=\int_a^b f(a+b-x)\,dx` },
      { name: 'Odd function', tex: r`\int_{-a}^{a}f(x)\,dx=0\ \text{ if } f(-x)=-f(x)` },
      { name: 'Even function', tex: r`\int_{-a}^{a}f(x)\,dx=2\int_0^a f(x)\,dx\ \text{ if } f(-x)=f(x)` },
    ],
  },
  {
    id: 'de', unit: 'calculus', name: 'Differential Equations', exams: ['main', 'adv'], weight: 'Medium',
    notes: [
      r`Order = highest derivative; degree = power of that derivative once the equation is polynomial in derivatives.`,
      r`Variable separable: bring all $y$ to one side, all $x$ to the other, integrate.`,
      r`Linear $\dfrac{dy}{dx}+Py=Q$: integrating factor $e^{\int P\,dx}$, then $y\cdot\text{IF}=\int Q\cdot\text{IF}\,dx$.`,
    ],
    formulas: [
      { name: 'Integrating factor', tex: r`\text{IF}=e^{\int P\,dx}` },
      { name: 'Linear DE solution', tex: r`y\cdot\text{IF}=\int Q\cdot\text{IF}\,dx+C` },
      { name: 'Exponential growth', tex: r`\dfrac{dN}{dt}=kN\Rightarrow N=N_0e^{kt}` },
    ],
  },
  // ───────────────────────── Coordinate geometry
  {
    id: 'lines', unit: 'coord', name: 'Straight Lines', exams: ['main', 'adv'], weight: 'Medium',
    notes: [
      r`Slopes: parallel ⇒ $m_1=m_2$; perpendicular ⇒ $m_1m_2=-1$.`,
      r`Before using the parallel-line distance formula, make the $x$ and $y$ coefficients identical.`,
    ],
    formulas: [
      { name: 'Distance of point from line', tex: r`d=\dfrac{|ax_1+by_1+c|}{\sqrt{a^2+b^2}}` },
      { name: 'Angle between lines', tex: r`\tan\theta=\left|\dfrac{m_1-m_2}{1+m_1m_2}\right|` },
      { name: 'Distance between parallel lines', tex: r`d=\dfrac{|c_1-c_2|}{\sqrt{a^2+b^2}}` },
      { name: 'Section formula', tex: r`\left(\dfrac{mx_2+nx_1}{m+n},\dfrac{my_2+ny_1}{m+n}\right)` },
    ],
  },
  {
    id: 'circles', unit: 'coord', name: 'Circles', exams: ['main', 'adv'], weight: 'Medium',
    notes: [
      r`$x^2+y^2+2gx+2fy+c=0$ has centre $(-g,-f)$ and radius $\sqrt{g^2+f^2-c}$.`,
      r`Common tangents: $d>r_1+r_2$: 4; $d=r_1+r_2$: 3; $|r_1-r_2|<d<r_1+r_2$: 2; $d=|r_1-r_2|$: 1; $d<|r_1-r_2|$: 0.`,
    ],
    formulas: [
      { name: 'Radius from general form', tex: r`r=\sqrt{g^2+f^2-c}` },
      { name: 'Diameter form', tex: r`(x-x_1)(x-x_2)+(y-y_1)(y-y_2)=0` },
      { name: 'Length of tangent', tex: r`\sqrt{S_1}=\sqrt{x_1^2+y_1^2+2gx_1+2fy_1+c}` },
      { name: 'Tangency condition (y = mx + c to x² + y² = a²)', tex: r`c^2=a^2(1+m^2)` },
    ],
  },
  {
    id: 'conics', unit: 'coord', name: 'Conic Sections', exams: ['main', 'adv'], weight: 'High',
    notes: [
      r`Parabola $y^2=4ax$: focus $(a,0)$, directrix $x=-a$, latus rectum $4a$.`,
      r`Ellipse $\frac{x^2}{a^2}+\frac{y^2}{b^2}=1$ ($a>b$): $b^2=a^2(1-e^2)$. Hyperbola: $b^2=a^2(e^2-1)$.`,
      r`Rectangular hyperbola ($a=b$) has $e=\sqrt2$.`,
    ],
    formulas: [
      { name: 'Tangent to y² = 4ax with slope m', tex: r`y=mx+\dfrac am` },
      { name: 'Ellipse eccentricity', tex: r`e=\sqrt{1-\dfrac{b^2}{a^2}}` },
      { name: 'Hyperbola eccentricity', tex: r`e=\sqrt{1+\dfrac{b^2}{a^2}}` },
      { name: 'Latus rectum (ellipse/hyperbola)', tex: r`\dfrac{2b^2}{a}` },
      { name: 'Distance between foci', tex: r`2ae` },
    ],
  },
  // ───────────────────────── Vectors & 3D
  {
    id: 'vectors', unit: 'vector3d', name: 'Vector Algebra', exams: ['main', 'adv', 'neet'], weight: 'High',
    notes: [
      r`$\vec a\cdot\vec b=|\vec a||\vec b|\cos\theta$ is a scalar; $\vec a\times\vec b$ is perpendicular to both with magnitude $|\vec a||\vec b|\sin\theta$.`,
      r`$|\vec a\times\vec b|$ = area of parallelogram on $\vec a,\vec b$; $[\vec a\ \vec b\ \vec c]$ = volume of parallelepiped.`,
    ],
    formulas: [
      { name: 'Dot product', tex: r`\vec a\cdot\vec b=a_1b_1+a_2b_2+a_3b_3` },
      { name: 'Projection of a on b', tex: r`\dfrac{\vec a\cdot\vec b}{|\vec b|}` },
      { name: 'Resultant of two vectors', tex: r`R=\sqrt{P^2+Q^2+2PQ\cos\theta}` },
      { name: 'Scalar triple product', tex: r`[\vec a\,\vec b\,\vec c]=\vec a\cdot(\vec b\times\vec c)` },
    ],
  },
  {
    id: 'three-d', unit: 'vector3d', name: 'Three Dimensional Geometry', exams: ['main', 'adv'], weight: 'High',
    notes: [
      r`Direction cosines satisfy $l^2+m^2+n^2=1$.`,
      r`Angle between planes = angle between their normals.`,
      r`Intercept form of a plane: $\dfrac xa+\dfrac yb+\dfrac zc=1$.`,
    ],
    formulas: [
      { name: 'Distance between points', tex: r`\sqrt{(x_2-x_1)^2+(y_2-y_1)^2+(z_2-z_1)^2}` },
      { name: 'Distance of point from plane', tex: r`\dfrac{|ax_1+by_1+cz_1+d|}{\sqrt{a^2+b^2+c^2}}` },
      { name: 'Direction cosines', tex: r`l^2+m^2+n^2=1` },
      { name: 'Angle between planes', tex: r`\cos\theta=\dfrac{|\vec n_1\cdot\vec n_2|}{|\vec n_1||\vec n_2|}` },
    ],
  },
  // ───────────────────────── Statistics & probability
  {
    id: 'statistics', unit: 'statprob', name: 'Statistics', exams: ['main'], weight: 'Medium',
    notes: [
      r`Adding a constant to every observation shifts the mean but leaves variance unchanged.`,
      r`Multiplying every observation by $k$ multiplies the mean by $k$ and the variance by $k^2$.`,
    ],
    formulas: [
      { name: 'Mean', tex: r`\bar x=\dfrac{\sum x_i}{n}` },
      { name: 'Variance', tex: r`\sigma^2=\dfrac{\sum x_i^2}{n}-\bar x^{\,2}` },
      { name: 'Mean deviation about mean', tex: r`\text{MD}=\dfrac{\sum|x_i-\bar x|}{n}` },
    ],
  },
  {
    id: 'probability', unit: 'statprob', name: 'Probability', exams: ['main', 'adv'], weight: 'High',
    notes: [
      r`Independent events: $P(A\cap B)=P(A)P(B)$. Mutually exclusive: $P(A\cap B)=0$.`,
      r`Bayes: update a prior using the likelihood of what was observed.`,
      r`Binomial distribution $B(n,p)$: mean $np$, variance $npq$.`,
    ],
    formulas: [
      { name: 'Addition rule', tex: r`P(A\cup B)=P(A)+P(B)-P(A\cap B)` },
      { name: 'Conditional probability', tex: r`P(A\mid B)=\dfrac{P(A\cap B)}{P(B)}` },
      { name: 'Bayes’ theorem', tex: r`P(E_i\mid A)=\dfrac{P(E_i)P(A\mid E_i)}{\sum_j P(E_j)P(A\mid E_j)}` },
      { name: 'Binomial probability', tex: r`P(X=r)=\dbinom nr p^rq^{n-r}` },
      { name: 'Binomial mean & variance', tex: r`\mu=np,\quad\sigma^2=npq` },
    ],
  },
  // ───────────────────────── Basic maths for physics (NEET)
  {
    id: 'basic-maths', unit: 'basics', name: 'Maths Toolkit for Physics', exams: ['neet', 'main'], weight: 'High',
    notes: [
      r`Velocity is $\dfrac{dx}{dt}$, acceleration is $\dfrac{dv}{dt}$; displacement is $\int v\,dt$.`,
      r`Small angles (in radians): $\sin\theta\approx\tan\theta\approx\theta$, $\cos\theta\approx1-\tfrac{\theta^2}{2}$.`,
      r`Logs turn products into sums — the backbone of decibels, pH-style scales and error propagation.`,
    ],
    formulas: [
      { name: 'Log of a product', tex: r`\log(ab)=\log a+\log b` },
      { name: 'Change of base', tex: r`\log_b a=\dfrac{\log a}{\log b}` },
      { name: 'Small-angle approximation', tex: r`\sin\theta\approx\theta\ \ (\theta\text{ in rad})` },
      { name: 'Relative error of a product', tex: r`\dfrac{\Delta(ab)}{ab}=\dfrac{\Delta a}{a}+\dfrac{\Delta b}{b}` },
      { name: 'Velocity & acceleration', tex: r`v=\dfrac{dx}{dt},\quad a=\dfrac{dv}{dt}=v\dfrac{dv}{dx}` },
    ],
  },
];

export const chapterById = Object.fromEntries(CHAPTERS.map((c) => [c.id, c]));
export const unitById = Object.fromEntries(UNITS.map((u) => [u.id, u]));

export const EXAMS = {
  all: 'All exams',
  main: 'JEE Main',
  adv: 'JEE Advanced',
  neet: 'NEET (Physics maths)',
};

// Flashcards derived from formulas: id = chapterId#index
export const FLASHCARDS = CHAPTERS.flatMap((c) =>
  c.formulas.map((f, i) => ({ id: `${c.id}#${i}`, chapter: c.id, front: f.name, back: f.tex }))
);
