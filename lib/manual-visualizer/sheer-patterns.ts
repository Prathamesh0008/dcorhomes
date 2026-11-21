const patternRoot='/images/manual-visualizer/sheer-patterns';

const patterns=[
 ['floral-lace','Floral Lace','fine-voile',225],
 ['embroidered-flowers','Embroidered Flowers','embroidered-sheer',240],
 ['leaf-pattern','Leaf Pattern','linen-sheer',245],
 ['diamond-net','Diamond Net','net-sheer',190],
 ['geometric-lace','Geometric Lace','jacquard-sheer',195],
 ['vertical-stripes','Vertical Stripes','striped-sheer',200],
 ['decorative-net','Decorative Net','net-sheer',225],
] as const;

export const sheerPatterns=patterns.map(([id,name,base,repeat])=>({
 id:'library-sheer-'+id,
 name,
 baseId:'library-sheer-'+base,
 repeat,
 texture:patternRoot+'/'+id+'.svg',
}));
