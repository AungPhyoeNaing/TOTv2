<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Category; // we’ll create this in step 2

class CategoryController extends Controller
{
    public function index()
    {
        // keep it tiny: id + name
        $cats = Category::select('id', 'name')->orderBy('name')->get();
        return response()->json(['data' => $cats]);
    }
}