<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Malfunction extends Model
{
    protected $table = 'malfunctions';

    protected $fillable = [
        'name',
        'types_wagon_id'
    ];
}
